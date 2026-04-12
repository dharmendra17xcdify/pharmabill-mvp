import sql from 'mssql';

type SerializableError = {
  name?: string;
  message?: string;
  stack?: string;
  code?: unknown;
  cause?: unknown;
  originalError?: unknown;
  thrown?: unknown;
};

function serializeError(err: unknown): SerializableError {
  if (err instanceof Error) {
    const extended = err as Error & {
      code?: unknown;
      cause?: unknown;
      originalError?: unknown;
    };

    return {
      name: err.name,
      message: err.message,
      stack: err.stack,
      code: extended.code,
      cause: extended.cause,
      originalError: extended.originalError,
    };
  }

  return {
    thrown: err,
  };
}

export function getDbDebugInfo() {
  const requiredEnv = ['DB_SERVER', 'DB_DATABASE'];
  const optionalEnv = ['DB_USER', 'DB_PASSWORD'];
  const missingRequiredEnv = requiredEnv.filter((key) => !process.env[key]);
  const missingOptionalEnv = optionalEnv.filter((key) => !process.env[key]);

  return {
    server: process.env.DB_SERVER ?? null,
    database: process.env.DB_DATABASE ?? null,
    hasUser: Boolean(process.env.DB_USER),
    hasPassword: Boolean(process.env.DB_PASSWORD),
    encrypt: process.env.DB_ENCRYPT !== 'false',
    trustServerCertificate: process.env.DB_TRUST_CERT === 'true',
    missingRequiredEnv,
    missingOptionalEnv,
  };
}

function getDbConfig(): sql.config {
  return {
    server: process.env.DB_SERVER!,
    database: process.env.DB_DATABASE!,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    options: {
      encrypt: process.env.DB_ENCRYPT !== 'false',
      trustServerCertificate: process.env.DB_TRUST_CERT === 'true',
      enableArithAbort: true,
    },
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000,
    },
  };
}

let poolPromise: Promise<sql.ConnectionPool> | null = null;

export async function getPool(): Promise<sql.ConnectionPool> {
  if (!poolPromise) {
    const debugInfo = getDbDebugInfo();

    if (debugInfo.missingRequiredEnv.length > 0) {
      const error = new Error(
        `Missing required database environment variables: ${debugInfo.missingRequiredEnv.join(', ')}`
      );
      console.error('Database configuration is incomplete', {
        error: serializeError(error),
        config: debugInfo,
      });
      throw error;
    }

    poolPromise = new sql.ConnectionPool(getDbConfig()).connect();
    poolPromise.catch((err) => {
      console.error('Database connection failed', {
        error: serializeError(err),
        config: getDbDebugInfo(),
      });
      poolPromise = null;
    });
  }
  return poolPromise;
}

export { sql };
