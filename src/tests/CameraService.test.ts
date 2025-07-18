/**
 * CameraService.test.ts
 * Unit tests for the CameraService
 */

import { CameraService } from '../services/CameraService';

// Mock navigator.mediaDevices
const mockMediaDevices = {
  getUserMedia: jest.fn(),
  enumerateDevices: jest.fn()
};

// Mock video element
class MockVideoElement {
  srcObject: MediaStream | null = null;
  playsInline = false;
  muted = false;
  readyState = 0;
  play = jest.fn().mockResolvedValue(undefined);
  addEventListener = jest.fn((event, callback) => {
    if (event === 'canplay') {
      callback();
    }
  });
  removeEventListener = jest.fn();
}

describe('CameraService', () => {
  let cameraService: CameraService;
  let mockVideo: any;
  let mockStream: MediaStream;
  let mockTrack: MediaStreamTrack;
  
  beforeEach(() => {
    // Set up mocks
    mockVideo = new MockVideoElement();
    mockTrack = { stop: jest.fn() } as unknown as MediaStreamTrack;
    mockStream = {
      getTracks: jest.fn().mockReturnValue([mockTrack]),
      active: true
    } as unknown as MediaStream;
    
    // Mock navigator.mediaDevices
    Object.defineProperty(navigator, 'mediaDevices', {
      value: mockMediaDevices,
      writable: true
    });
    
    mockMediaDevices.getUserMedia.mockResolvedValue(mockStream);
    mockMediaDevices.enumerateDevices.mockResolvedValue([
      { kind: 'videoinput', deviceId: 'camera1', label: 'Front Camera' },
      { kind: 'videoinput', deviceId: 'camera2', label: 'Back Camera' }
    ]);
    
    // Create camera service
    cameraService = new CameraService();
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  test('initialize should set up video element and start camera', async () => {
    const errorCallback = jest.fn();
    
    const result = await cameraService.initialize(mockVideo as unknown as HTMLVideoElement, errorCallback);
    
    expect(result).toBe(true);
    expect(mockMediaDevices.getUserMedia).toHaveBeenCalled();
    expect(mockVideo.srcObject).toBe(mockStream);
    expect(mockVideo.play).toHaveBeenCalled();
  });
  
  test('startCamera should handle camera access denied error', async () => {
    const errorCallback = jest.fn();
    await cameraService.initialize(mockVideo as unknown as HTMLVideoElement, errorCallback);
    
    // Mock permission denied error
    const permissionError = new DOMException('Permission denied', 'NotAllowedError');
    mockMediaDevices.getUserMedia.mockRejectedValueOnce(permissionError);
    
    const result = await cameraService.startCamera();
    
    expect(result).toBe(false);
    expect(errorCallback).toHaveBeenCalledWith(expect.stringContaining('Camera access denied'));
  });
  
  test('stopCamera should stop all tracks', async () => {
    await cameraService.initialize(mockVideo as unknown as HTMLVideoElement);
    
    cameraService.stopCamera();
    
    expect(mockTrack.stop).toHaveBeenCalled();
    expect(mockVideo.srcObject).toBeNull();
  });
  
  test('updateAvailableDevices should return camera devices', async () => {
    const devices = await cameraService.updateAvailableDevices();
    
    expect(devices.length).toBe(2);
    expect(devices[0].deviceId).toBe('camera1');
    expect(devices[1].deviceId).toBe('camera2');
  });
  
  test('switchCamera should update settings and restart camera', async () => {
    await cameraService.initialize(mockVideo as unknown as HTMLVideoElement);
    
    // Spy on startCamera
    const startCameraSpy = jest.spyOn(cameraService, 'startCamera');
    
    await cameraService.switchCamera('camera2');
    
    expect(startCameraSpy).toHaveBeenCalled();
    // Check that getUserMedia was called with the right device ID
    expect(mockMediaDevices.getUserMedia).toHaveBeenCalledWith(
      expect.objectContaining({
        video: expect.objectContaining({
          deviceId: expect.objectContaining({ exact: 'camera2' })
        })
      })
    );
  });
  
  test('toggleFacingMode should switch between front and back cameras', async () => {
    await cameraService.initialize(mockVideo as unknown as HTMLVideoElement);
    
    // Spy on startCamera
    const startCameraSpy = jest.spyOn(cameraService, 'startCamera');
    
    // Default is 'user' (front camera)
    await cameraService.toggleFacingMode();
    
    // Should now be 'environment' (back camera)
    expect(startCameraSpy).toHaveBeenCalled();
    expect(mockMediaDevices.getUserMedia).toHaveBeenCalledWith(
      expect.objectContaining({
        video: expect.objectContaining({
          facingMode: 'environment'
        })
      })
    );
    
    // Toggle again
    await cameraService.toggleFacingMode();
    
    // Should now be back to 'user' (front camera)
    expect(mockMediaDevices.getUserMedia).toHaveBeenCalledWith(
      expect.objectContaining({
        video: expect.objectContaining({
          facingMode: 'user'
        })
      })
    );
  });
});