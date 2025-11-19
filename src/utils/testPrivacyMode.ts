
import { PrivacyModeUtils } from './privacyMode';

// Mock localStorage and sessionStorage
const originalLocalStorage = global.localStorage;
const originalSessionStorage = global.sessionStorage;

const mockStorage = (shouldThrow: boolean, errorName: string = 'Error') => {
    const storage = {
        setItem: () => {
            if (shouldThrow) {
                const error = new Error('Mock Error');
                error.name = errorName;
                throw error;
            }
        },
        removeItem: () => { },
        getItem: () => null,
    };

    Object.defineProperty(global, 'localStorage', { value: storage, writable: true });
    Object.defineProperty(global, 'sessionStorage', { value: storage, writable: true });
};

const runTests = async () => {
    console.log('🧪 Starting Privacy Mode Tests...');
    let passed = 0;
    let failed = 0;

    const assert = (condition: boolean, message: string) => {
        if (condition) {
            console.log(`✅ PASS: ${message}`);
            passed++;
        } else {
            console.error(`❌ FAIL: ${message}`);
            failed++;
        }
    };

    // Test 1: Normal Mode (No Errors)
    mockStorage(false);
    const isPrivate1 = await PrivacyModeUtils.isPrivateMode();
    assert(isPrivate1 === false, 'Should return false in normal mode');

    // Test 2: Private Mode (Generic Error)
    mockStorage(true, 'SecurityError');
    const isPrivate2 = await PrivacyModeUtils.isPrivateMode();
    assert(isPrivate2 === true, 'Should return true for generic security errors');

    // Test 3: Quota Error (QuotaExceededError)
    mockStorage(true, 'QuotaExceededError');
    const isPrivate3 = await PrivacyModeUtils.isPrivateMode();
    assert(isPrivate3 === false, 'Should return false for QuotaExceededError');

    // Test 4: Quota Error (NS_ERROR_DOM_QUOTA_REACHED)
    mockStorage(true, 'NS_ERROR_DOM_QUOTA_REACHED');
    const isPrivate4 = await PrivacyModeUtils.isPrivateMode();
    assert(isPrivate4 === false, 'Should return false for NS_ERROR_DOM_QUOTA_REACHED');

    // Restore original storage
    Object.defineProperty(global, 'localStorage', { value: originalLocalStorage, writable: true });
    Object.defineProperty(global, 'sessionStorage', { value: originalSessionStorage, writable: true });

    console.log(`\n📊 Test Results: ${passed} Passed, ${failed} Failed`);

    if (failed > 0) {
        process.exit(1);
    }
};

runTests().catch(console.error);
