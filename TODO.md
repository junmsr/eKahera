# Camera Scanning Fix for Laptop Single Webcam

## Tasks
- [ ] Modify ScannerCard.jsx to detect available cameras on initialization
- [ ] Add logic to handle single-camera devices (laptops) by using the first available camera
- [ ] Improve error handling for OverconstrainedError and other camera issues
- [ ] Update UI to hide camera toggle button when only one camera is available
- [ ] Add fallback to enumerate devices and select appropriate camera
- [ ] Test camera access and scanning functionality

## Information Gathered
- The app uses @yudiel/react-qr-scanner library
- ScannerCard component handles camera switching between 'user' (front) and 'environment' (rear)
- Laptops typically have one webcam, causing conflicts when trying to switch facing modes
- Current implementation assumes mobile device with dual cameras

## Plan
- Detect available video devices on component mount
- If only one camera available, use it directly without facing mode constraints
- Hide toggle button if multiple cameras not available
- Add better error messages for camera access issues
- Fallback to device enumeration if facing mode fails

## Dependent Files
- frontend/src/components/ui/POS/ScannerCard.jsx (primary file to edit)

## Followup Steps
- Test on laptop with single webcam
- Verify scanning still works on mobile devices
- Check browser console for any errors
