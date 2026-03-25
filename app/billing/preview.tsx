import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Text } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton } from '../../src/components/AppButton';
import { getBillById } from '../../src/db/billRepo';
import { useSettingsStore } from '../../src/store/useSettingsStore';
import { generatePDF } from '../../src/services/invoiceService';
import { sharePDF, shareOnWhatsApp } from '../../src/services/shareService';
import { buildInvoiceHTML } from '../../src/utils/invoice';
import { Bill, BillItem } from '../../src/types/bill';
import { COLORS } from '../../src/constants/paymentModes';

export default function InvoicePreviewScreen() {
  const { billId } = useLocalSearchParams<{ billId: string }>();
  const router = useRouter();
  const { settings } = useSettingsStore();

  const [bill, setBill] = useState<(Bill & { items: BillItem[] }) | null>(null);
  const [html, setHtml] = useState<string>('');
  const [pdfUri, setPdfUri] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [whatsapping, setWhatsapping] = useState(false);

  useEffect(() => {
    if (!billId) return;
    getBillById(Number(billId)).then((b) => {
      if (!b || !settings) return;
      setBill(b);
      setHtml(buildInvoiceHTML(b, b.items, settings));
    });
  }, [billId, settings]);

  const getPDFUri = async (): Promise<string> => {
    if (pdfUri) return pdfUri;
    if (!bill || !settings) throw new Error('No bill data');
    setGenerating(true);
    try {
      const uri = await generatePDF(bill, bill.items, settings);
      setPdfUri(uri);
      return uri;
    } finally {
      setGenerating(false);
    }
  };

  const handleShareBill = async () => {
    setSharing(true);
    try {
      const uri = await getPDFUri();
      await sharePDF(uri);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to share bill.');
    } finally {
      setSharing(false);
    }
  };

  const handleWhatsApp = async () => {
    if (!bill || !settings) return;
    setWhatsapping(true);
    try {
      const uri = await getPDFUri();
      await shareOnWhatsApp(uri, bill, settings);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to open WhatsApp.');
    } finally {
      setWhatsapping(false);
    }
  };

  if (!bill) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.container}>
        <View style={styles.webViewContainer}>
          {html ? (
            <WebView
              source={{ html }}
              style={styles.webView}
              originWhitelist={['*']}
              scalesPageToFit={false}
            />
          ) : (
            <ActivityIndicator style={{ flex: 1 }} size="large" color={COLORS.primary} />
          )}
        </View>

        <View style={styles.actions}>
          <AppButton
            label={whatsapping ? 'Opening WhatsApp...' : '💬 Send on WhatsApp'}
            onPress={handleWhatsApp}
            loading={whatsapping || generating}
            style={{ marginBottom: 8 }}
          />
          <AppButton
            label={sharing ? 'Sharing...' : '📤 Share PDF'}
            onPress={handleShareBill}
            loading={sharing || generating}
            variant="outline"
            style={{ marginBottom: 8 }}
          />
          <AppButton
            label="Back to Dashboard"
            onPress={() => router.replace('/(tabs)')}
            variant="outline"
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1 },
  webViewContainer: { flex: 1, backgroundColor: '#fff' },
  webView: { flex: 1 },
  actions: { padding: 16, paddingBottom: 8, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: COLORS.border },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
