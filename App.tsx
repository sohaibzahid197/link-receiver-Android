import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  Button,
  Linking,
  StyleSheet,
  Alert,
  AppState,
  NativeModules,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import {WebView} from 'react-native-webview';

const {SharedText} = NativeModules;
const {height} = Dimensions.get('window');

function App(): React.JSX.Element {
  const [sharedLink, setSharedLink] = useState<string>('');
  const [linkHistory, setLinkHistory] = useState<string[]>([]);
  const [showWebView, setShowWebView] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const checkForSharedText = async () => {
      try {
        if (SharedText && SharedText.getSharedText) {
          const text = await SharedText.getSharedText();
          if (text) {
            processIncomingLink(text);
          }
        }
      } catch (error) {
        console.log('Error getting shared text:', error);
      }
    };

    checkForSharedText();

    const appStateSubscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        checkForSharedText();
      }
    });

    return () => {
      appStateSubscription.remove();
    };
  }, []);

  useEffect(() => {
    const handleDeepLink = async () => {
      try {
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl && initialUrl.includes('://')) {
          processIncomingLink(initialUrl);
        }

        const subscription = Linking.addEventListener('url', ({url}) => {
          processIncomingLink(url);
        });

        return () => {
          subscription.remove();
        };
      } catch (error) {
        console.log('Error handling deep links:', error);
      }
    };

    handleDeepLink();
  }, []);

  const processIncomingLink = (url: string) => {
    console.log('Processing URL:', url);
    
    let processedLink = url;

    if (url.startsWith('whatsappclone://chat/')) {
      const phone = url.replace('whatsappclone://chat/', '');
      processedLink = `Chat with: ${phone}`;
    }

    setSharedLink(processedLink);
    addToHistory(processedLink);
    
    // Auto-load if it's a valid URL
    if (isValidUrl(processedLink)) {
      setShowWebView(true);
    }
    
    Alert.alert(
      'Link Received!', 
      `Successfully received: ${getDomain(processedLink)}`,
      [{ text: 'OK' }]
    );
  };

  const addToHistory = (link: string) => {
    if (link && !linkHistory.includes(link)) {
      setLinkHistory(prev => [link, ...prev].slice(0, 10));
    }
  };

  const isValidUrl = (url: string): boolean => {
    return url.includes('http') || url.includes('www.') || 
           url.includes('.com') || url.includes('.org') || 
           url.includes('.net') || url.includes('amazon') ||
           url.includes('youtube');
  };

  const getDomain = (url: string): string => {
    try {
      if (url.includes('amazon')) return 'Amazon';
      if (url.includes('youtube')) return 'YouTube';
      if (url.includes('whatsapp')) return 'WhatsApp';
      
      const match = url.match(/^(?:https?:\/\/)?(?:www\.)?([^\/]+)/i);
      return match ? match[1] : 'Shared Content';
    } catch {
      return 'Unknown Source';
    }
  };

  const clearLink = () => {
    setSharedLink('');
    setShowWebView(false);
  };

  const loadInApp = () => {
    if (!sharedLink) return;

    if (isValidUrl(sharedLink)) {
      setShowWebView(true);
    } else {
      Alert.alert('Error', 'Not a valid URL to load');
    }
  };

  const openInBrowser = async () => {
    if (!sharedLink) return;

    try {
      let urlToOpen = sharedLink;
      if (!urlToOpen.startsWith('http')) {
        urlToOpen = 'https://' + urlToOpen;
      }
      
      const supported = await Linking.canOpenURL(urlToOpen);
      if (supported) {
        await Linking.openURL(urlToOpen);
      } else {
        Alert.alert('Error', 'Cannot open this URL');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open URL');
    }
  };

  const testShareFunctionality = () => {
    const testLinks = [
      'https://www.amazon.com/dp/PRODUCT123',
      'https://www.youtube.com/watch?v=VIDEO_ID',
      'https://www.google.com',
      'https://github.com',
    ];
    
    const randomLink = testLinks[Math.floor(Math.random() * testLinks.length)];
    setSharedLink(randomLink);
    addToHistory(randomLink);
    setShowWebView(true);
  };

  const getValidUrl = (url: string): string => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    return 'https://' + url;
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🔗 Link Receiver</Text>
      <Text style={styles.subtitle}>Share any content to this app!</Text>

      {/* Received Content Display */}
      <View style={styles.contentBox}>
        <Text style={styles.sectionTitle}>Received Content:</Text>
        <View style={styles.linkDisplay}>
          <Text style={styles.linkText}>
            {sharedLink || 'No content received yet...\n\nShare something from another app!'}
          </Text>
        </View>

        {sharedLink ? (
          <View style={styles.buttonColumn}>
            <TouchableOpacity style={styles.primaryButton} onPress={loadInApp}>
              <Text style={styles.primaryButtonText}>📱 Load in App</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.secondaryButton} onPress={openInBrowser}>
              <Text style={styles.secondaryButtonText}>🌐 Open in Browser</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.clearButton} onPress={clearLink}>
              <Text style={styles.clearButtonText}>🗑️ Clear</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>

      {/* WebView Section - Shows in Same Screen */}
      {showWebView && isValidUrl(sharedLink) && (
        <View style={styles.webViewSection}>
          <View style={styles.webViewHeader}>
            <View style={styles.webViewTitleContainer}>
              <Text style={styles.webViewDomain}>{getDomain(sharedLink)}</Text>
              <Text style={styles.webViewUrl} numberOfLines={1}>
                {sharedLink}
              </Text>
            </View>
            <View style={styles.webViewActions}>
              <TouchableOpacity 
                onPress={openInBrowser} 
                style={styles.actionButton}
              >
                <Text style={styles.actionButtonText}>Open ↗</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => setShowWebView(false)} 
                style={[styles.actionButton, styles.closeButton]}
              >
                <Text style={styles.actionButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.webViewWrapper}>
            {isLoading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Loading...</Text>
              </View>
            )}
            <WebView
              source={{uri: getValidUrl(sharedLink)}}
              style={styles.webView}
              onLoadStart={() => setIsLoading(true)}
              onLoadEnd={() => setIsLoading(false)}
              startInLoadingState={true}
              javaScriptEnabled={true}
              domStorageEnabled={true}
            />
          </View>
        </View>
      )}

      {/* Test Section */}
      <View style={styles.testSection}>
        <Text style={styles.sectionTitle}>Test & Demo:</Text>
        
        <View style={styles.buttonContainer}>
          <Button 
            title="🧪 Test with Sample Link" 
            onPress={testShareFunctionality} 
          />
        </View>
      </View>

      {/* History */}
      {linkHistory.length > 0 && (
        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>Recent Shares:</Text>
          {linkHistory.slice(0, 5).map((link, index) => (
            <TouchableOpacity 
              key={index} 
              onPress={() => {
                setSharedLink(link);
                if (isValidUrl(link)) {
                  setShowWebView(true);
                }
              }}
              style={styles.historyItemContainer}
            >
              <Text style={styles.historyItem} numberOfLines={1}>
                • {getDomain(link)}: {link.length > 40 ? link.substring(0, 40) + '...' : link}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Instructions */}
      <View style={styles.instructions}>
        <Text style={styles.instructionsTitle}>How to share to this app:</Text>
        <Text style={styles.instruction}>1. Open Chrome, Amazon, YouTube, etc.</Text>
        <Text style={styles.instruction}>2. Tap "Share" button</Text>
        <Text style={styles.instruction}>3. Select "DeepLinkApp" from the list</Text>
        <Text style={styles.instruction}>4. Link will load automatically below!</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
    marginTop: 20,
    color: '#007AFF',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    color: '#666',
    marginBottom: 30,
  },
  contentBox: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    elevation: 3,
  },
  testSection: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    elevation: 3,
  },
  historySection: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 15,
    color: '#333',
  },
  linkDisplay: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
    minHeight: 80,
    justifyContent: 'center',
  },
  linkText: {
    fontSize: 14,
    color: '#495057',
    lineHeight: 20,
    textAlign: 'center',
  },
  buttonColumn: {
    marginTop: 15,
    gap: 10,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#34C759',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  clearButton: {
    backgroundColor: '#FF3B30',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonContainer: {
    marginVertical: 5,
  },
  historyItemContainer: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  historyItem: {
    fontSize: 12,
    color: '#007AFF',
  },
  instructions: {
    backgroundColor: '#E3F2FD',
    padding: 15,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
    marginBottom: 30,
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 10,
  },
  instruction: {
    fontSize: 12,
    color: '#1976D2',
    marginBottom: 5,
  },
  // WebView Section Styles (In Same Screen)
  webViewSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 20,
    elevation: 3,
    overflow: 'hidden',
  },
  webViewHeader: {
    backgroundColor: '#007AFF',
    padding: 15,
  },
  webViewTitleContainer: {
    marginBottom: 10,
  },
  webViewDomain: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  webViewUrl: {
    color: '#E3F2FF',
    fontSize: 11,
  },
  webViewActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  closeButton: {
    backgroundColor: 'rgba(255, 59, 48, 0.8)',
    borderColor: 'rgba(255, 59, 48, 0.5)',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  webViewWrapper: {
    height: height * 0.6, // 60% of screen height
    position: 'relative',
  },
  webView: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    zIndex: 10,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
});

export default App;