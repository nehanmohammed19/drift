// Drift Mouse Tracking Extension - Content Script
let isTracking = false;
let sessionStartTime = 0;
let mouseData = [];
let lastPosition = null;
let dataPointCount = 0;
let totalDistance = 0;
let maxSpeed = 0;
let speedSamples = [];
let startPosition = null;

// Configuration
const CAPTURE_INTERVAL = 16; // ~60fps
const MIN_DISTANCE_THRESHOLD = 2; // Minimum pixels to record
let lastCaptureTime = 0;

// Create visual indicator for tracking status
function createTrackingIndicator() {
  const indicator = document.createElement('div');
  indicator.id = 'drift-tracking-indicator';
  indicator.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    width: 120px;
    height: 80px;
    background: rgba(0, 0, 0, 0.9);
    border: 2px solid #00ffff;
    border-radius: 10px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-family: 'Orbitron', monospace;
    font-size: 9px;
    color: #00ffff;
    text-align: center;
    z-index: 10000;
    box-shadow: 0 0 20px rgba(0, 255, 255, 0.5);
    opacity: 0;
    transition: opacity 0.3s ease;
    backdrop-filter: blur(10px);
  `;
  indicator.innerHTML = `
    <div style="font-weight: bold; margin-bottom: 5px;">DRIFT ACTIVE</div>
    <div id="drift-count">0</div>
    <div id="drift-efficiency">0%</div>
  `;
  document.body.appendChild(indicator);
  return indicator;
}

function updateTrackingIndicator() {
  const indicator = document.getElementById('drift-tracking-indicator');
  if (indicator) {
    const countElement = indicator.querySelector('#drift-count');
    const efficiencyElement = indicator.querySelector('#drift-efficiency');
    
    if (countElement) countElement.textContent = dataPointCount;
    if (efficiencyElement) {
      const efficiency = calculatePathEfficiency();
      efficiencyElement.textContent = `${efficiency.toFixed(1)}%`;
    }
  }
}

function showTrackingIndicator() {
  const indicator = document.getElementById('drift-tracking-indicator') || createTrackingIndicator();
  indicator.style.opacity = '1';
  indicator.style.animation = 'pulse 2s infinite';
}

function hideTrackingIndicator() {
  const indicator = document.getElementById('drift-tracking-indicator');
  if (indicator) {
    indicator.style.opacity = '0';
    setTimeout(() => {
      if (indicator.parentNode) {
        indicator.parentNode.removeChild(indicator);
      }
    }, 300);
  }
}

// Calculate distance between two points
function calculateDistance(x1, y1, x2, y2) {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

// Calculate speed in pixels per second
function calculateSpeed(distance, timeDiff) {
  return timeDiff > 0 ? (distance / timeDiff) * 1000 : 0;
}

// Calculate path efficiency (optimal path vs actual path)
function calculatePathEfficiency() {
  if (!startPosition || mouseData.length < 2) return 0;
  
  const currentPosition = mouseData[mouseData.length - 1];
  const optimalDistance = calculateDistance(
    startPosition.x, startPosition.y,
    currentPosition.x, currentPosition.y
  );
  
  if (optimalDistance === 0) return 100;
  
  const efficiency = (optimalDistance / totalDistance) * 100;
  return Math.min(efficiency, 100); // Cap at 100%
}

// Generate comprehensive analytics
function generateAnalytics() {
  if (mouseData.length < 2) return null;
  
  const sessionDuration = Date.now() - sessionStartTime;
  const timeRange = mouseData[mouseData.length - 1].time - mouseData[0].time;
  
  // Calculate movement patterns
  let horizontalMovement = 0;
  let verticalMovement = 0;
  let directionChanges = 0;
  let previousDirection = null;
  
  for (let i = 1; i < mouseData.length; i++) {
    const dx = mouseData[i].x - mouseData[i-1].x;
    const dy = mouseData[i].y - mouseData[i-1].y;
    
    horizontalMovement += Math.abs(dx);
    verticalMovement += Math.abs(dy);
    
    // Detect direction changes
    const currentDirection = {
      x: dx > 0 ? 'right' : dx < 0 ? 'left' : 'none',
      y: dy > 0 ? 'down' : dy < 0 ? 'up' : 'none'
    };
    
    if (previousDirection && 
        (currentDirection.x !== previousDirection.x || currentDirection.y !== previousDirection.y)) {
      directionChanges++;
    }
    previousDirection = currentDirection;
  }
  
  // Calculate average speed
  const avgSpeed = speedSamples.length > 0 ? 
    speedSamples.reduce((a, b) => a + b, 0) / speedSamples.length : 0;
  
  // Calculate path efficiency
  const pathEfficiency = calculatePathEfficiency();
  
  // Calculate optimal path distance
  let optimalDistance = 0;
  if (startPosition && mouseData.length > 0) {
    const currentPosition = mouseData[mouseData.length - 1];
    optimalDistance = calculateDistance(
      startPosition.x, startPosition.y,
      currentPosition.x, currentPosition.y
    );
  }
  
  return {
    sessionDuration: sessionDuration,
    timeRange: timeRange,
    totalPoints: dataPointCount,
    totalDistance: totalDistance,
    optimalDistance: optimalDistance,
    pathEfficiency: pathEfficiency,
    maxSpeed: maxSpeed,
    averageSpeed: avgSpeed,
    horizontalMovement: horizontalMovement,
    verticalMovement: verticalMovement,
    directionChanges: directionChanges,
    movementEfficiency: totalDistance / (horizontalMovement + verticalMovement),
    pointsPerSecond: dataPointCount / (sessionDuration / 1000),
    dataDensity: dataPointCount / (totalDistance || 1)
  };
}

// Export data to local mouseData folder
function exportData(analytics) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  
  // Create JSON data structure
  const jsonData = {
    session_metadata: {
      timestamp: new Date().toISOString(),
      session_id: sessionStartTime,
      duration: analytics ? analytics.sessionDuration : 0,
      total_points: dataPointCount
    },
    mouse_tracking_data: mouseData,
    analytics: analytics || {}
  };
  
  // Prepare CSV data
  let csvData = null;
  if (mouseData.length > 0) {
    const csvHeaders = ['x', 'y', 'time', 'distance'];
    const csvRows = [csvHeaders.join(',')];
    
    mouseData.forEach(point => {
      csvRows.push(`${point.x},${point.y},${point.time},${point.distance || 0}`);
    });
    
    csvData = csvRows.join('\n');
  }
  
  // Save to local mouseData folder using chrome.storage
  const dataToStore = {
    jsonData: jsonData,
    csvData: csvData,
    timestamp: timestamp
  };
  
  chrome.storage.local.set({ 
    [`mouseData_${timestamp}`]: dataToStore 
  }, () => {
    console.log("%c[DRIFT] %cData saved to local storage: mouseData_" + timestamp, 
      "color: #00ffff; font-weight: bold;", 
      "color: #00ff00;");
    
    // Also try to save to the mouseData.js file in the extension directory
    saveToMouseDataFile(jsonData, csvData, timestamp);
  });
}

// Save data to mouseData.js file
function saveToMouseDataFile(jsonData, csvData, timestamp) {
  // Create a data URL for the JSON file
  const jsonBlob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
  const jsonUrl = URL.createObjectURL(jsonBlob);
  
  // Create a data URL for the CSV file
  const csvBlob = new Blob([csvData], { type: 'text/csv' });
  const csvUrl = URL.createObjectURL(csvBlob);
  
  // Try to download to the mouseData folder
  chrome.downloads.download({
    url: jsonUrl,
    filename: `mouseData/drift_mouse_data_${timestamp}.json`,
    saveAs: false
  }, (downloadId) => {
    URL.revokeObjectURL(jsonUrl);
    if (chrome.runtime.lastError) {
      console.log("JSON download failed, data saved to storage only:", chrome.runtime.lastError.message);
    } else {
      console.log('JSON file download started:', downloadId);
    }
  });
  
  if (csvData) {
    chrome.downloads.download({
      url: csvUrl,
      filename: `mouseData/drift_mouse_data_${timestamp}.csv`,
      saveAs: false
    }, (downloadId) => {
      URL.revokeObjectURL(csvUrl);
      if (chrome.runtime.lastError) {
        console.log("CSV download failed, data saved to storage only:", chrome.runtime.lastError.message);
      } else {
        console.log('CSV file download started:', downloadId);
      }
    });
  }
}

// Enhanced mouse tracking with throttling and analytics
function handleMouseMove(event) {
  if (!isTracking) return;
  
  const currentTime = Date.now();
  
  // Throttle captures for performance
  if (currentTime - lastCaptureTime < CAPTURE_INTERVAL) return;
  
  const currentPosition = { x: event.clientX, y: event.clientY };
  
  // Set start position on first movement
  if (!startPosition) {
    startPosition = currentPosition;
  }
  
  // Only record if mouse moved enough
  if (lastPosition) {
    const distance = calculateDistance(
      lastPosition.x, lastPosition.y, 
      currentPosition.x, currentPosition.y
    );
    
    if (distance < MIN_DISTANCE_THRESHOLD) return;
    
    // Calculate speed
    const timeDiff = (currentTime - lastPosition.time) / 1000;
    const speed = calculateSpeed(distance, timeDiff);
    
    if (speed > maxSpeed) maxSpeed = speed;
    speedSamples.push(speed);
    
    // Keep only recent speed samples for average calculation
    if (speedSamples.length > 50) speedSamples.shift();
    
    totalDistance += distance;
  }
  
  const point = { 
    x: currentPosition.x, 
    y: currentPosition.y, 
    time: currentTime,
    distance: lastPosition ? calculateDistance(lastPosition.x, lastPosition.y, currentPosition.x, currentPosition.y) : 0
  };
  
  mouseData.push(point);
  dataPointCount++;
  lastCaptureTime = currentTime;
  lastPosition = { ...currentPosition, time: currentTime };
  
  // Update indicator
  updateTrackingIndicator();
  
  // Log progress every 100 points
  if (dataPointCount % 100 === 0) {
    const efficiency = calculatePathEfficiency();
    console.log("%c[DRIFT] %cData point #" + dataPointCount + " | Distance: " + Math.round(totalDistance) + "px | Efficiency: " + efficiency.toFixed(1) + "%", 
      "color: #00ffff; font-weight: bold;", 
      "color: #ffffff;");
  }
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.command === "start") {
    startTracking();
    sendResponse({ success: true });
  }

  if (message.command === "stop") {
    stopTracking();
    sendResponse({ success: true });
  }
  
  if (message.command === "get_analytics") {
    const analytics = generateAnalytics();
    sendResponse({ analytics: analytics });
  }
  
  if (message.command === "get_status") {
    sendResponse({ 
      isTracking: isTracking, 
      dataPointCount: dataPointCount,
      sessionStartTime: sessionStartTime
    });
  }
});

function startTracking() {
  if (isTracking) {
    console.log("%c[DRIFT] %cAlready tracking, stopping previous session", 
      "color: #ff0066; font-weight: bold;", 
      "color: #ffffff;");
    stopTracking();
  }
  
  isTracking = true;
  sessionStartTime = Date.now();
  mouseData = [];
  dataPointCount = 0;
  lastCaptureTime = 0;
  lastPosition = null;
  totalDistance = 0;
  maxSpeed = 0;
  speedSamples = [];
  startPosition = null;
  
  // Add event listener
  document.addEventListener("mousemove", handleMouseMove);
  
  showTrackingIndicator();
  
  console.log("%c[DRIFT] %cADVANCED NEURAL TRACKING SYSTEM INITIALIZED", 
    "color: #00ffff; font-weight: bold; font-size: 14px;", 
    "color: #ff00ff; font-size: 12px;");
  console.log("%c[DRIFT] %cMouse tracking enabled", 
    "color: #00ffff; font-weight: bold;", 
    "color: #ffffff;");
}

function stopTracking() {
  if (!isTracking) {
    console.log("%c[DRIFT] %cNo active tracking session", 
      "color: #ff0066; font-weight: bold;", 
      "color: #ffffff;");
    return;
  }
  
  console.log("%c[DRIFT] %cStopping tracking session", 
    "color: #ff0066; font-weight: bold;", 
    "color: #ffffff;");
  
  // Remove event listener
  document.removeEventListener("mousemove", handleMouseMove);
  
  const analytics = generateAnalytics();
  
  console.log("%c[DRIFT] %cTRACKING TERMINATED", 
    "color: #ff0066; font-weight: bold; font-size: 14px;", 
    "color: #ffffff;");
  console.log("%c[DRIFT] %cSession Analytics:", 
    "color: #00ffff; font-weight: bold;", 
    "color: #ffffff;");
  console.table(analytics);
  console.log("%c[DRIFT] %cRaw movement data:", 
    "color: #00ffff; font-weight: bold;", 
    "color: #ffffff;");
  console.table(mouseData);
  
  // Export data
  exportData(analytics);
  
  // Clean up
  hideTrackingIndicator();
  isTracking = false;
  
  console.log("%c[DRIFT] %cTracking stopped", 
    "color: #ff0066; font-weight: bold;", 
    "color: #ffffff;");
}

// Add CSS for pulse animation
const style = document.createElement('style');
style.textContent = `
  @keyframes pulse {
    0% { box-shadow: 0 0 20px rgba(0, 255, 255, 0.5); }
    50% { box-shadow: 0 0 30px rgba(0, 255, 255, 0.8); }
    100% { box-shadow: 0 0 20px rgba(0, 255, 255, 0.5); }
  }
`;
document.head.appendChild(style);

console.log("%c[DRIFT] %cContent script loaded successfully", 
  "color: #00ffff; font-weight: bold;", 
  "color: #00ff00;");
