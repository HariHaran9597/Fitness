/**
 * UserProgress.test.ts
 * Tests for the UserProgress model
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { UserProgress, WorkoutSession } from '../models/UserProgress';

// Mock IndexedDB
const mockIndexedDB = {
  open: vi.fn(),
  deleteDatabase: vi.fn()
};

const mockIDBOpenDBRequest = {
  onupgradeneeded: null as any,
  onsuccess: null as any,
  onerror: null as any,
  result: {
    createObjectStore: vi.fn().mockReturnValue({
      createIndex: vi.fn()
    }),
    objectStoreNames: {
      contains: vi.fn().mockReturnValue(false)
    },
    transaction: vi.fn().mockReturnValue({
      objectStore: vi.fn().mockReturnValue({
        get: vi.fn().mockReturnValue({
          onsuccess: null as any,
          onerror: null as any,
          result: null
        }),
        put: vi.fn().mockReturnValue({
          onsuccess: null as any,
          onerror: null as any
        }),
        add: vi.fn().mockReturnValue({
          onsuccess: null as any,
          onerror: null as any
        }),
        delete: vi.fn().mockReturnValue({
          onsuccess: null as any,
          onerror: null as any
        }),
        index: vi.fn().mockReturnValue({
          openCursor: vi.fn().mockReturnValue({
            onsuccess: null as any,
            onerror: null as any
          })
        })
      })
    }),
    close: vi.fn()
  }
};

// Mock global IndexedDB
global.indexedDB = mockIndexedDB as any;

describe('UserProgress', () => {
  let userProgress: UserProgress;
  
  beforeEach(() => {
    // Reset mocks
    vi.resetAllMocks();
    
    // Set up mock IndexedDB
    mockIndexedDB.open.mockReturnValue(mockIDBOpenDBRequest);
    
    // Create UserProgress instance
    userProgress = new UserProgress('test-user');
  });
  
  afterEach(() => {
    // Clean up
    userProgress.close();
  });
  
  it('should initialize with default values', async () => {
    // Mock successful database open
    mockIndexedDB.open.mockImplementation(() => {
      setTimeout(() => {
        if (mockIDBOpenDBRequest.onupgradeneeded) {
          mockIDBOpenDBRequest.onupgradeneeded({ target: mockIDBOpenDBRequest } as any);
        }
        if (mockIDBOpenDBRequest.onsuccess) {
          mockIDBOpenDBRequest.onsuccess({ target: mockIDBOpenDBRequest } as any);
        }
      }, 0);
      
      return mockIDBOpenDBRequest;
    });
    
    // Mock get user progress
    const mockGet = {
      onsuccess: null as any,
      onerror: null as any,
      result: null
    };
    
    mockIDBOpenDBRequest.result.transaction().objectStore().get.mockReturnValue(mockGet);
    
    // Mock put user progress
    const mockPut = {
      onsuccess: null as any,
      onerror: null as any
    };
    
    mockIDBOpenDBRequest.result.transaction().objectStore().put.mockReturnValue(mockPut);
    
    // Initialize user progress
    const initPromise = userProgress.initialize();
    
    // Trigger get success with no result
    setTimeout(() => {
      if (mockGet.onsuccess) {
        mockGet.onsuccess();
      }
      
      // Trigger put success
      setTimeout(() => {
        if (mockPut.onsuccess) {
          mockPut.onsuccess();
        }
      }, 0);
    }, 0);
    
    await initPromise;
    
    // Check if user progress is initialized with default values
    const progressData = userProgress.getUserProgressData();
    
    expect(progressData).not.toBeNull();
    expect(progressData?.userId).toBe('test-user');
    expect(progressData?.totalWorkouts).toBe(0);
    expect(progressData?.totalExerciseTime).toBe(0);
    expect(progressData?.exerciseStats.size).toBe(0);
    expect(progressData?.achievements.length).toBe(0);
    expect(progressData?.totalAnimalsRescued).toEqual({ cats: 0, dogs: 0, penguins: 0 });
    expect(progressData?.streakDays).toBe(0);
    expect(progressData?.lastWorkout).toBeNull();
  });
  
  it('should record a workout session', async () => {
    // Mock successful database open
    mockIndexedDB.open.mockImplementation(() => {
      setTimeout(() => {
        if (mockIDBOpenDBRequest.onupgradeneeded) {
          mockIDBOpenDBRequest.onupgradeneeded({ target: mockIDBOpenDBRequest } as any);
        }
        if (mockIDBOpenDBRequest.onsuccess) {
          mockIDBOpenDBRequest.onsuccess({ target: mockIDBOpenDBRequest } as any);
        }
      }, 0);
      
      return mockIDBOpenDBRequest;
    });
    
    // Mock get user progress
    const mockGet = {
      onsuccess: null as any,
      onerror: null as any,
      result: null
    };
    
    mockIDBOpenDBRequest.result.transaction().objectStore().get.mockReturnValue(mockGet);
    
    // Mock put user progress
    const mockPut = {
      onsuccess: null as any,
      onerror: null as any
    };
    
    mockIDBOpenDBRequest.result.transaction().objectStore().put.mockReturnValue(mockPut);
    
    // Mock add workout session
    const mockAdd = {
      onsuccess: null as any,
      onerror: null as any
    };
    
    mockIDBOpenDBRequest.result.transaction().objectStore().add.mockReturnValue(mockAdd);
    
    // Initialize user progress
    const initPromise = userProgress.initialize();
    
    // Trigger get success with no result
    setTimeout(() => {
      if (mockGet.onsuccess) {
        mockGet.onsuccess();
      }
      
      // Trigger put success
      setTimeout(() => {
        if (mockPut.onsuccess) {
          mockPut.onsuccess();
        }
      }, 0);
    }, 0);
    
    await initPromise;
    
    // Create workout session
    const session: WorkoutSession = {
      sessionId: 'test-session',
      exerciseType: 'pushup',
      startTime: new Date(),
      endTime: new Date(),
      totalReps: 10,
      duration: 300000, // 5 minutes
      averageFormScore: 0.8,
      animalsRescued: [
        { type: 'dogs', count: 5 }
      ]
    };
    
    // Record workout session
    const recordPromise = userProgress.recordWorkoutSession(session);
    
    // Trigger add success
    setTimeout(() => {
      if (mockAdd.onsuccess) {
        mockAdd.onsuccess();
      }
      
      // Trigger put success
      setTimeout(() => {
        if (mockPut.onsuccess) {
          mockPut.onsuccess();
        }
      }, 0);
    }, 0);
    
    await recordPromise;
    
    // Check if user progress is updated
    const progressData = userProgress.getUserProgressData();
    
    expect(progressData).not.toBeNull();
    expect(progressData?.totalWorkouts).toBe(1);
    expect(progressData?.totalExerciseTime).toBe(300000);
    expect(progressData?.exerciseStats.size).toBe(1);
    expect(progressData?.exerciseStats.get('pushup')).toBeDefined();
    expect(progressData?.exerciseStats.get('pushup')?.totalReps).toBe(10);
    expect(progressData?.totalAnimalsRescued.dogs).toBe(5);
    expect(progressData?.lastWorkout).not.toBeNull();
  });
});