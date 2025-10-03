import React, {useState, useEffect} from 'react';
import {View, Text, Button, Linking, StyleSheet, Alert, AppState, NativeModules} from 'react-native';

const {SharedText} = NativeModules;

function App(): React.JSX.Element {
  const [sharedLink, setSharedLink] = useState<string>('');
  const [linkHistory, setLinkHistory] = useState<string[]>([]);

  // Check for shared text when app starts or comes to foreground
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

    // Check immediately
    checkForSharedText();

    // Check when app comes to foreground
    const appStateSubscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        checkForSharedText();
      }
    });

    return () => {
      appStateSubscription.remove();
    };
  }, []);

  // Handle deep links (whatsappclone://)
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

    // Handle different URL types
    if (url.startsWith('whatsappclone://chat/')) {
      const phone = url.replace('whatsappclone://chat/', '');
      processedLink = `Chat with: ${phone}`;
    }

    setSharedLink(processedLink);
    addToHistory(processedLink);
    
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
  };

  const openLink = async () => {
    if (!sharedLink) return;

    try {
      // For regular URLs, open in browser
      if (sharedLink.includes('http') || sharedLink.includes('.')) {
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
      } else {
        Alert.alert('Info', `This is: ${sharedLink}`);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open URL');
    }
  };

  const testShareFunctionality = () => {
    const testLinks = [
      'https://amazon.com/dp/PRODUCT123',
      'https://youtube.com/watch?v=VIDEO_ID',
      'whatsappclone://chat/+1234567890',
      'Shared text content'
    ];
    
    const randomLink = testLinks[Math.floor(Math.random() * testLinks.length)];
    setSharedLink(randomLink);
    addToHistory(randomLink);
  };

  return (
    <View style={styles.container}>
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
          <View style={styles.buttonRow}>
            <Button 
              title="📱 Open" 
              onPress={openLink} 
            />
            <Button 
              title="🗑️ Clear" 
              onPress={clearLink} 
              color="#FF3B30"
            />
          </View>
        ) : null}
      </View>

      {/* Test Section */}
      <View style={styles.testSection}>
        <Text style={styles.sectionTitle}>Test & Demo:</Text>
        
        <View style={styles.buttonContainer}>
          <Button 
            title="🧪 Test with Sample Content" 
            onPress={testShareFunctionality} 
          />
        </View>

        <View style={styles.buttonContainer}>
          <Button 
            title="💬 Test Deep Link" 
            onPress={() => Linking.openURL('whatsappclone://chat/+1234567890')} 
          />
        </View>
      </View>

      {/* History */}
      {linkHistory.length > 0 && (
        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>Recent Shares:</Text>
          {linkHistory.slice(0, 3).map((link, index) => (
            <Text key={index} style={styles.historyItem} numberOfLines={1}>
              • {getDomain(link)}: {link.length > 30 ? link.substring(0, 30) + '...' : link}
            </Text>
          ))}
        </View>
      )}

      {/* Instructions */}
      <View style={styles.instructions}>
        <Text style={styles.instructionsTitle}>How to share to this app:</Text>
        <Text style={styles.instruction}>1. Open Chrome, Amazon, YouTube, etc.</Text>
        <Text style={styles.instruction}>2. Tap "Share" button</Text>
        <Text style={styles.instruction}>3. Select "DeepLinkApp" from the list</Text>
        <Text style={styles.instruction}>4. Content will appear here automatically!</Text>
        
        <Text style={styles.note}>
          💡 Or test with: adb shell am start -a android.intent.action.SEND -t text/plain -e android.intent.extra.TEXT "https://amazon.com/product" com.deeplinkapp
        </Text>
      </View>
    </View>
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
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
    gap: 10,
  },
  buttonContainer: {
    marginVertical: 5,
  },
  historyItem: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  instructions: {
    backgroundColor: '#E3F2FD',
    padding: 15,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
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
  note: {
    fontSize: 11,
    color: '#1976D2',
    fontStyle: 'italic',
    marginTop: 10,
  },
});

export default App;