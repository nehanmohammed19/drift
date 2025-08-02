// Background script for Drift extension
chrome.runtime.onInstalled.addListener(() => {
  console.log('Drift extension installed');
});

// Handle downloads
chrome.downloads.onChanged.addListener((downloadDelta) => {
  if (downloadDelta.state && downloadDelta.state.current === 'complete') {
    console.log('Download completed:', downloadDelta.id);
  }
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'download_files') {
    const { jsonData, csvData, timestamp } = message;
    
    // Download JSON file
    const jsonBlob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
    const jsonUrl = URL.createObjectURL(jsonBlob);
    
    chrome.downloads.download({
      url: jsonUrl,
      filename: `drift_mouse_data_${timestamp}.json`,
      saveAs: false
    }, (downloadId) => {
      URL.revokeObjectURL(jsonUrl);
      console.log('JSON file download started:', downloadId);
    });
    
    // Download CSV file
    if (csvData) {
      const csvBlob = new Blob([csvData], { type: 'text/csv' });
      const csvUrl = URL.createObjectURL(csvBlob);
      
      chrome.downloads.download({
        url: csvUrl,
        filename: `drift_mouse_data_${timestamp}.csv`,
        saveAs: false
      }, (downloadId) => {
        URL.revokeObjectURL(csvUrl);
        console.log('CSV file download started:', downloadId);
      });
    }
    
    sendResponse({ success: true });
  }
});
