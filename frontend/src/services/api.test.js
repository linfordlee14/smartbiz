/**
 * Property-Based Tests for API Service
 * Using fast-check for property-based testing
 */

import {
    describe,
    it,
    expect,
    afterEach
} from 'vitest';
import * as fc from 'fast-check';
import {
    sendMessage,
    sendMessageWithVoice,
    generateInvoice,
    runSmartSQL
} from './api.js';

/**
 * **Feature: react-frontend-api, Property 1: Empty input validation**
 * **Validates: Requirements 2.3**
 * 
 * For any input that is empty, whitespace-only, or missing,
 * sendMessage SHALL return an error object without making a network request.
 */
describe('Property 1: Empty input validation (sendMessage)', () => {
    it('should return error for any whitespace-only string', async () => {
        await fc.assert(
            fc.asyncProperty(
                // Generate strings containing only whitespace characters
                fc.array(fc.constantFrom(' ', '\t', '\n', '\r', '\f', '\v')).map(arr => arr.join('')),
                async (whitespaceString) => {
                    const result = await sendMessage(whitespaceString);

                    // Must return an error object
                    expect(result).toHaveProperty('error');
                    expect(typeof result.error).toBe('string');
                    // Must not have a response property (no network request made)
                    expect(result).not.toHaveProperty('response');
                }
            ), {
                numRuns: 100
            }
        );
    });

    it('should return error for empty string', async () => {
        const result = await sendMessage('');
        expect(result).toHaveProperty('error');
        expect(typeof result.error).toBe('string');
        expect(result).not.toHaveProperty('response');
    });

    it('should return error for undefined input', async () => {
        const result = await sendMessage(undefined);
        expect(result).toHaveProperty('error');
        expect(typeof result.error).toBe('string');
    });

    it('should return error for null input', async () => {
        const result = await sendMessage(null);
        expect(result).toHaveProperty('error');
        expect(typeof result.error).toBe('string');
    });

    it('should return error for non-string inputs', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.oneof(
                    fc.integer(),
                    fc.boolean(),
                    fc.array(fc.anything()),
                    fc.object()
                ),
                async (nonStringInput) => {
                    const result = await sendMessage(nonStringInput);

                    // Must return an error object
                    expect(result).toHaveProperty('error');
                    expect(typeof result.error).toBe('string');
                }
            ), {
                numRuns: 100
            }
        );
    });
});

/**
 * **Feature: react-frontend-api, Property 4: Voice request payload**
 * **Validates: Requirements 3.2**
 * 
 * For any call to sendMessageWithVoice with a valid message,
 * the request payload SHALL include enable_voice: true.
 */
describe('Property 4: Voice request payload', () => {
    it('should include enable_voice: true in request payload for any valid message', async () => {
        // Track the request payload sent to fetch
        let capturedPayload = null;
        const originalFetch = global.fetch;

        global.fetch = async (url, options) => {
            capturedPayload = JSON.parse(options.body);
            // Return a mock response to prevent actual network call
            return {
                ok: true,
                headers: {
                    get: () => 'application/json'
                },
                json: async () => ({
                    response: 'test response'
                })
            };
        };

        try {
            await fc.assert(
                fc.asyncProperty(
                    // Generate non-empty strings (valid messages)
                    fc.string({
                        minLength: 1
                    }).filter(s => s.trim().length > 0),
                    // Optional context
                    fc.option(fc.string(), {
                        nil: undefined
                    }),
                    // Optional voice_id
                    fc.option(fc.string(), {
                        nil: undefined
                    }),
                    async (message, context, voice_id) => {
                        capturedPayload = null;

                        await sendMessageWithVoice(message, context, voice_id);

                        // Verify enable_voice is true in the payload
                        expect(capturedPayload).not.toBeNull();
                        expect(capturedPayload.enable_voice).toBe(true);
                        expect(capturedPayload.message).toBe(message);
                    }
                ), {
                    numRuns: 100
                }
            );
        } finally {
            global.fetch = originalFetch;
        }
    });

    it('should return error for empty message without making network request', async () => {
        let fetchCalled = false;
        const originalFetch = global.fetch;

        global.fetch = async () => {
            fetchCalled = true;
            return {
                ok: true,
                headers: {
                    get: () => 'application/json'
                },
                json: async () => ({})
            };
        };

        try {
            await fc.assert(
                fc.asyncProperty(
                    // Generate whitespace-only strings
                    fc.array(fc.constantFrom(' ', '\t', '\n', '\r')).map(arr => arr.join('')),
                    async (whitespaceString) => {
                        fetchCalled = false;

                        const result = await sendMessageWithVoice(whitespaceString);

                        // Must return error without making network request
                        expect(result).toHaveProperty('error');
                        expect(fetchCalled).toBe(false);
                    }
                ), {
                    numRuns: 100
                }
            );
        } finally {
            global.fetch = originalFetch;
        }
    });
});


/**
 * **Feature: react-frontend-api, Property 2: Required field validation for invoices**
 * **Validates: Requirements 4.3**
 * 
 * For any call to generateInvoice where business_id, client_name, or items is missing or empty,
 * the method SHALL return an error object without making a network request.
 */
describe('Property 2: Required field validation for invoices', () => {
    it('should return error when business_id is missing or empty', async () => {
        let fetchCalled = false;
        const originalFetch = global.fetch;

        global.fetch = async () => {
            fetchCalled = true;
            return {
                ok: true,
                json: async () => ({})
            };
        };

        try {
            await fc.assert(
                fc.asyncProperty(
                    // Generate invalid business_id values: empty, whitespace-only, null, undefined
                    fc.oneof(
                        fc.constant(''),
                        fc.constant(null),
                        fc.constant(undefined),
                        fc.array(fc.constantFrom(' ', '\t', '\n', '\r')).map(arr => arr.join(''))
                    ),
                    // Valid client_name
                    fc.string({
                        minLength: 1
                    }).filter(s => s.trim().length > 0),
                    // Valid items array
                    fc.array(
                        fc.record({
                            description: fc.string({
                                minLength: 1
                            }),
                            quantity: fc.integer({
                                min: 1
                            }),
                            unit_price: fc.double({
                                min: 0.01,
                                noNaN: true
                            })
                        }), {
                            minLength: 1
                        }
                    ),
                    async (invalidBusinessId, clientName, items) => {
                        fetchCalled = false;

                        const result = await generateInvoice(invalidBusinessId, clientName, items);

                        // Must return error without making network request
                        expect(result).toHaveProperty('error');
                        expect(typeof result.error).toBe('string');
                        expect(fetchCalled).toBe(false);
                    }
                ), {
                    numRuns: 100
                }
            );
        } finally {
            global.fetch = originalFetch;
        }
    });

    it('should return error when client_name is missing or empty', async () => {
        let fetchCalled = false;
        const originalFetch = global.fetch;

        global.fetch = async () => {
            fetchCalled = true;
            return {
                ok: true,
                json: async () => ({})
            };
        };

        try {
            await fc.assert(
                fc.asyncProperty(
                    // Valid business_id
                    fc.string({
                        minLength: 1
                    }).filter(s => s.trim().length > 0),
                    // Generate invalid client_name values: empty, whitespace-only, null, undefined
                    fc.oneof(
                        fc.constant(''),
                        fc.constant(null),
                        fc.constant(undefined),
                        fc.array(fc.constantFrom(' ', '\t', '\n', '\r')).map(arr => arr.join(''))
                    ),
                    // Valid items array
                    fc.array(
                        fc.record({
                            description: fc.string({
                                minLength: 1
                            }),
                            quantity: fc.integer({
                                min: 1
                            }),
                            unit_price: fc.double({
                                min: 0.01,
                                noNaN: true
                            })
                        }), {
                            minLength: 1
                        }
                    ),
                    async (businessId, invalidClientName, items) => {
                        fetchCalled = false;

                        const result = await generateInvoice(businessId, invalidClientName, items);

                        // Must return error without making network request
                        expect(result).toHaveProperty('error');
                        expect(typeof result.error).toBe('string');
                        expect(fetchCalled).toBe(false);
                    }
                ), {
                    numRuns: 100
                }
            );
        } finally {
            global.fetch = originalFetch;
        }
    });

    it('should return error when items is missing or empty', async () => {
        let fetchCalled = false;
        const originalFetch = global.fetch;

        global.fetch = async () => {
            fetchCalled = true;
            return {
                ok: true,
                json: async () => ({})
            };
        };

        try {
            await fc.assert(
                fc.asyncProperty(
                    // Valid business_id
                    fc.string({
                        minLength: 1
                    }).filter(s => s.trim().length > 0),
                    // Valid client_name
                    fc.string({
                        minLength: 1
                    }).filter(s => s.trim().length > 0),
                    // Generate invalid items values: empty array, null, undefined, non-array
                    fc.oneof(
                        fc.constant([]),
                        fc.constant(null),
                        fc.constant(undefined),
                        fc.string(),
                        fc.integer(),
                        fc.object()
                    ),
                    async (businessId, clientName, invalidItems) => {
                        fetchCalled = false;

                        const result = await generateInvoice(businessId, clientName, invalidItems);

                        // Must return error without making network request
                        expect(result).toHaveProperty('error');
                        expect(typeof result.error).toBe('string');
                        expect(fetchCalled).toBe(false);
                    }
                ), {
                    numRuns: 100
                }
            );
        } finally {
            global.fetch = originalFetch;
        }
    });

    it('should not return error when all required fields are valid', async () => {
        const originalFetch = global.fetch;

        global.fetch = async () => {
            return {
                ok: true,
                json: async () => ({
                    id: 'test-id',
                    invoice_number: 'INV-001'
                })
            };
        };

        try {
            await fc.assert(
                fc.asyncProperty(
                    // Valid business_id
                    fc.string({
                        minLength: 1
                    }).filter(s => s.trim().length > 0),
                    // Valid client_name
                    fc.string({
                        minLength: 1
                    }).filter(s => s.trim().length > 0),
                    // Valid items array
                    fc.array(
                        fc.record({
                            description: fc.string({
                                minLength: 1
                            }),
                            quantity: fc.integer({
                                min: 1
                            }),
                            unit_price: fc.double({
                                min: 0.01,
                                noNaN: true
                            })
                        }), {
                            minLength: 1
                        }
                    ),
                    async (businessId, clientName, items) => {
                        const result = await generateInvoice(businessId, clientName, items);

                        // Should not return an error for valid inputs
                        expect(result).not.toHaveProperty('error');
                    }
                ), {
                    numRuns: 100
                }
            );
        } finally {
            global.fetch = originalFetch;
        }
    });
});


/**
 * **Feature: react-frontend-api, Property 3: Consistent error structure**
 * **Validates: Requirements 1.2, 1.3, 2.4, 4.4, 5.4**
 * 
 * For any API method that encounters an error (network, validation, or backend),
 * the returned error object SHALL contain an `error` property with a string message.
 */
describe('Property 3: Consistent error structure', () => {
    it('should return consistent error structure for validation errors across all methods', async () => {
        await fc.assert(
            fc.asyncProperty(
                // Generate invalid inputs (empty, whitespace-only, null, undefined)
                fc.oneof(
                    fc.constant(''),
                    fc.constant(null),
                    fc.constant(undefined),
                    fc.array(fc.constantFrom(' ', '\t', '\n', '\r')).map(arr => arr.join(''))
                ),
                async (invalidInput) => {
                    // Test sendMessage
                    const sendMessageResult = await sendMessage(invalidInput);
                    expect(sendMessageResult).toHaveProperty('error');
                    expect(typeof sendMessageResult.error).toBe('string');
                    expect(sendMessageResult.error.length).toBeGreaterThan(0);

                    // Test sendMessageWithVoice
                    const voiceResult = await sendMessageWithVoice(invalidInput);
                    expect(voiceResult).toHaveProperty('error');
                    expect(typeof voiceResult.error).toBe('string');
                    expect(voiceResult.error.length).toBeGreaterThan(0);

                    // Test runSmartSQL
                    const smartSqlResult = await runSmartSQL(invalidInput);
                    expect(smartSqlResult).toHaveProperty('error');
                    expect(typeof smartSqlResult.error).toBe('string');
                    expect(smartSqlResult.error.length).toBeGreaterThan(0);
                }
            ), {
                numRuns: 100
            }
        );
    });

    it('should return consistent error structure for generateInvoice validation errors', async () => {
        await fc.assert(
            fc.asyncProperty(
                // Generate invalid business_id
                fc.oneof(
                    fc.constant(''),
                    fc.constant(null),
                    fc.constant(undefined),
                    fc.array(fc.constantFrom(' ', '\t', '\n', '\r')).map(arr => arr.join(''))
                ),
                async (invalidBusinessId) => {
                    const result = await generateInvoice(invalidBusinessId, 'Valid Client', [{
                        description: 'Item',
                        quantity: 1,
                        unit_price: 100
                    }]);

                    expect(result).toHaveProperty('error');
                    expect(typeof result.error).toBe('string');
                    expect(result.error.length).toBeGreaterThan(0);
                }
            ), {
                numRuns: 100
            }
        );
    });

    it('should return consistent error structure for network errors', async () => {
        const originalFetch = global.fetch;

        // Simulate network error
        global.fetch = async () => {
            throw new Error('Network failure');
        };

        try {
            await fc.assert(
                fc.asyncProperty(
                    // Generate valid non-empty strings
                    fc.string({
                        minLength: 1
                    }).filter(s => s.trim().length > 0),
                    async (validInput) => {
                        // Test sendMessage network error
                        const sendMessageResult = await sendMessage(validInput);
                        expect(sendMessageResult).toHaveProperty('error');
                        expect(typeof sendMessageResult.error).toBe('string');
                        expect(sendMessageResult.error.length).toBeGreaterThan(0);

                        // Test sendMessageWithVoice network error
                        const voiceResult = await sendMessageWithVoice(validInput);
                        expect(voiceResult).toHaveProperty('error');
                        expect(typeof voiceResult.error).toBe('string');
                        expect(voiceResult.error.length).toBeGreaterThan(0);

                        // Test runSmartSQL network error
                        const smartSqlResult = await runSmartSQL(validInput);
                        expect(smartSqlResult).toHaveProperty('error');
                        expect(typeof smartSqlResult.error).toBe('string');
                        expect(smartSqlResult.error.length).toBeGreaterThan(0);
                    }
                ), {
                    numRuns: 100
                }
            );
        } finally {
            global.fetch = originalFetch;
        }
    });

    it('should return consistent error structure for generateInvoice network errors', async () => {
        const originalFetch = global.fetch;

        // Simulate network error
        global.fetch = async () => {
            throw new Error('Network failure');
        };

        try {
            await fc.assert(
                fc.asyncProperty(
                    // Valid business_id
                    fc.string({
                        minLength: 1
                    }).filter(s => s.trim().length > 0),
                    // Valid client_name
                    fc.string({
                        minLength: 1
                    }).filter(s => s.trim().length > 0),
                    // Valid items array
                    fc.array(
                        fc.record({
                            description: fc.string({
                                minLength: 1
                            }),
                            quantity: fc.integer({
                                min: 1
                            }),
                            unit_price: fc.double({
                                min: 0.01,
                                noNaN: true
                            })
                        }), {
                            minLength: 1
                        }
                    ),
                    async (businessId, clientName, items) => {
                        const result = await generateInvoice(businessId, clientName, items);

                        expect(result).toHaveProperty('error');
                        expect(typeof result.error).toBe('string');
                        expect(result.error.length).toBeGreaterThan(0);
                    }
                ), {
                    numRuns: 100
                }
            );
        } finally {
            global.fetch = originalFetch;
        }
    });

    it('should return consistent error structure for backend errors', async () => {
        const originalFetch = global.fetch;

        await fc.assert(
            fc.asyncProperty(
                // Generate valid non-empty strings
                fc.string({
                    minLength: 1
                }).filter(s => s.trim().length > 0),
                // Generate random error messages from backend
                fc.string({
                    minLength: 1
                }).filter(s => s.trim().length > 0),
                async (validInput, backendErrorMessage) => {
                    // Simulate backend error response
                    global.fetch = async () => ({
                        ok: false,
                        json: async () => ({
                            error: backendErrorMessage
                        })
                    });

                    // Test sendMessage backend error
                    const sendMessageResult = await sendMessage(validInput);
                    expect(sendMessageResult).toHaveProperty('error');
                    expect(typeof sendMessageResult.error).toBe('string');
                    expect(sendMessageResult.error.length).toBeGreaterThan(0);

                    // Test sendMessageWithVoice backend error
                    const voiceResult = await sendMessageWithVoice(validInput);
                    expect(voiceResult).toHaveProperty('error');
                    expect(typeof voiceResult.error).toBe('string');
                    expect(voiceResult.error.length).toBeGreaterThan(0);

                    // Test runSmartSQL backend error
                    const smartSqlResult = await runSmartSQL(validInput);
                    expect(smartSqlResult).toHaveProperty('error');
                    expect(typeof smartSqlResult.error).toBe('string');
                    expect(smartSqlResult.error.length).toBeGreaterThan(0);
                }
            ), {
                numRuns: 100
            }
        );

        global.fetch = originalFetch;
    });

    it('should return fallback error message when backend returns no error field', async () => {
        const originalFetch = global.fetch;

        // Simulate backend error response without error field
        global.fetch = async () => ({
            ok: false,
            json: async () => ({})
        });

        try {
            await fc.assert(
                fc.asyncProperty(
                    // Generate valid non-empty strings
                    fc.string({
                        minLength: 1
                    }).filter(s => s.trim().length > 0),
                    async (validInput) => {
                        // Test sendMessage - should have fallback error
                        const sendMessageResult = await sendMessage(validInput);
                        expect(sendMessageResult).toHaveProperty('error');
                        expect(typeof sendMessageResult.error).toBe('string');
                        expect(sendMessageResult.error.length).toBeGreaterThan(0);

                        // Test runSmartSQL - should have fallback error
                        const smartSqlResult = await runSmartSQL(validInput);
                        expect(smartSqlResult).toHaveProperty('error');
                        expect(typeof smartSqlResult.error).toBe('string');
                        expect(smartSqlResult.error.length).toBeGreaterThan(0);
                    }
                ), {
                    numRuns: 100
                }
            );
        } finally {
            global.fetch = originalFetch;
        }
    });
});


/**
 * **Feature: react-frontend-api, Property 1: Empty input validation (runSmartSQL)**
 * **Validates: Requirements 5.3**
 * 
 * For any input that is empty, whitespace-only, or missing,
 * runSmartSQL SHALL return an error object without making a network request.
 */
describe('Property 1: Empty input validation (runSmartSQL)', () => {
    it('should return error for any whitespace-only string', async () => {
        let fetchCalled = false;
        const originalFetch = global.fetch;

        global.fetch = async () => {
            fetchCalled = true;
            return {
                ok: true,
                json: async () => ({
                    sql: 'SELECT 1',
                    results: []
                })
            };
        };

        try {
            await fc.assert(
                fc.asyncProperty(
                    // Generate strings containing only whitespace characters
                    fc.array(fc.constantFrom(' ', '\t', '\n', '\r', '\f', '\v')).map(arr => arr.join('')),
                    async (whitespaceString) => {
                        fetchCalled = false;

                        const result = await runSmartSQL(whitespaceString);

                        // Must return an error object
                        expect(result).toHaveProperty('error');
                        expect(typeof result.error).toBe('string');
                        // Must not have sql or results properties (no network request made)
                        expect(result).not.toHaveProperty('sql');
                        expect(result).not.toHaveProperty('results');
                        // Verify no network request was made
                        expect(fetchCalled).toBe(false);
                    }
                ), {
                    numRuns: 100
                }
            );
        } finally {
            global.fetch = originalFetch;
        }
    });

    it('should return error for empty string', async () => {
        let fetchCalled = false;
        const originalFetch = global.fetch;

        global.fetch = async () => {
            fetchCalled = true;
            return {
                ok: true,
                json: async () => ({
                    sql: 'SELECT 1',
                    results: []
                })
            };
        };

        try {
            const result = await runSmartSQL('');
            expect(result).toHaveProperty('error');
            expect(typeof result.error).toBe('string');
            expect(result).not.toHaveProperty('sql');
            expect(result).not.toHaveProperty('results');
            expect(fetchCalled).toBe(false);
        } finally {
            global.fetch = originalFetch;
        }
    });

    it('should return error for undefined input', async () => {
        let fetchCalled = false;
        const originalFetch = global.fetch;

        global.fetch = async () => {
            fetchCalled = true;
            return {
                ok: true,
                json: async () => ({
                    sql: 'SELECT 1',
                    results: []
                })
            };
        };

        try {
            const result = await runSmartSQL(undefined);
            expect(result).toHaveProperty('error');
            expect(typeof result.error).toBe('string');
            expect(fetchCalled).toBe(false);
        } finally {
            global.fetch = originalFetch;
        }
    });

    it('should return error for null input', async () => {
        let fetchCalled = false;
        const originalFetch = global.fetch;

        global.fetch = async () => {
            fetchCalled = true;
            return {
                ok: true,
                json: async () => ({
                    sql: 'SELECT 1',
                    results: []
                })
            };
        };

        try {
            const result = await runSmartSQL(null);
            expect(result).toHaveProperty('error');
            expect(typeof result.error).toBe('string');
            expect(fetchCalled).toBe(false);
        } finally {
            global.fetch = originalFetch;
        }
    });

    it('should return error for non-string inputs', async () => {
        let fetchCalled = false;
        const originalFetch = global.fetch;

        global.fetch = async () => {
            fetchCalled = true;
            return {
                ok: true,
                json: async () => ({
                    sql: 'SELECT 1',
                    results: []
                })
            };
        };

        try {
            await fc.assert(
                fc.asyncProperty(
                    fc.oneof(
                        fc.integer(),
                        fc.boolean(),
                        fc.array(fc.anything()),
                        fc.object()
                    ),
                    async (nonStringInput) => {
                        fetchCalled = false;

                        const result = await runSmartSQL(nonStringInput);

                        // Must return an error object
                        expect(result).toHaveProperty('error');
                        expect(typeof result.error).toBe('string');
                        // Verify no network request was made
                        expect(fetchCalled).toBe(false);
                    }
                ), {
                    numRuns: 100
                }
            );
        } finally {
            global.fetch = originalFetch;
        }
    });

    it('should not return error for valid non-empty query', async () => {
        const originalFetch = global.fetch;

        global.fetch = async () => {
            return {
                ok: true,
                json: async () => ({
                    sql: 'SELECT * FROM users',
                    results: []
                })
            };
        };

        try {
            await fc.assert(
                fc.asyncProperty(
                    // Generate non-empty strings (valid queries)
                    fc.string({
                        minLength: 1
                    }).filter(s => s.trim().length > 0),
                    async (validQuery) => {
                        const result = await runSmartSQL(validQuery);

                        // Should not return an error for valid inputs
                        expect(result).not.toHaveProperty('error');
                        expect(result).toHaveProperty('sql');
                        expect(result).toHaveProperty('results');
                    }
                ), {
                    numRuns: 100
                }
            );
        } finally {
            global.fetch = originalFetch;
        }
    });
});


/**
 * Unit Tests for API Service
 * Testing specific examples and edge cases
 */

/**
 * Unit Tests for sendMessage
 * _Requirements: 2.1, 2.2, 2.3, 2.4_
 */
describe('Unit Tests: sendMessage', () => {
    const originalFetch = global.fetch;

    afterEach(() => {
        global.fetch = originalFetch;
    });

    it('should return response for valid message', async () => {
        global.fetch = async (url, options) => {
            expect(url).toBe('http://localhost:5000/api/chat');
            expect(options.method).toBe('POST');
            const body = JSON.parse(options.body);
            expect(body.message).toBe('Hello AI');
            return {
                ok: true,
                json: async () => ({
                    response: 'Hello! How can I help you?'
                })
            };
        };

        const result = await sendMessage('Hello AI');
        expect(result).toEqual({
            response: 'Hello! How can I help you?'
        });
    });

    it('should include context when provided', async () => {
        global.fetch = async (url, options) => {
            const body = JSON.parse(options.body);
            expect(body.message).toBe('What is my balance?');
            expect(body.context).toBe('User is a business owner');
            return {
                ok: true,
                json: async () => ({
                    response: 'Your balance is R1000'
                })
            };
        };

        const result = await sendMessage('What is my balance?', 'User is a business owner');
        expect(result).toEqual({
            response: 'Your balance is R1000'
        });
    });

    it('should return error for empty message', async () => {
        let fetchCalled = false;
        global.fetch = async () => {
            fetchCalled = true;
            return {
                ok: true,
                json: async () => ({})
            };
        };

        const result = await sendMessage('');
        expect(result).toHaveProperty('error');
        expect(result.error).toBe('Message cannot be empty');
        expect(fetchCalled).toBe(false);
    });

    it('should return error for whitespace-only message', async () => {
        let fetchCalled = false;
        global.fetch = async () => {
            fetchCalled = true;
            return {
                ok: true,
                json: async () => ({})
            };
        };

        const result = await sendMessage('   \t\n  ');
        expect(result).toHaveProperty('error');
        expect(fetchCalled).toBe(false);
    });

    it('should handle network error', async () => {
        global.fetch = async () => {
            throw new Error('Connection refused');
        };

        const result = await sendMessage('Hello');
        expect(result).toHaveProperty('error');
        expect(result.error).toBe('Network error: Connection refused');
    });

    it('should propagate backend error', async () => {
        global.fetch = async () => ({
            ok: false,
            json: async () => ({
                error: 'Internal server error'
            })
        });

        const result = await sendMessage('Hello');
        expect(result).toEqual({
            error: 'Internal server error'
        });
    });

    it('should return fallback error when backend returns no error field', async () => {
        global.fetch = async () => ({
            ok: false,
            json: async () => ({})
        });

        const result = await sendMessage('Hello');
        expect(result).toEqual({
            error: 'Request failed'
        });
    });
});


/**
 * Unit Tests for sendMessageWithVoice
 * _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
 */
describe('Unit Tests: sendMessageWithVoice', () => {
    const originalFetch = global.fetch;

    afterEach(() => {
        global.fetch = originalFetch;
    });

    it('should return audio blob for valid message with audio response', async () => {
        const mockAudioBlob = new Blob(['audio data'], {
            type: 'audio/mpeg'
        });

        global.fetch = async (url, options) => {
            expect(url).toBe('http://localhost:5000/api/chat/voice');
            const body = JSON.parse(options.body);
            expect(body.message).toBe('Tell me a joke');
            expect(body.enable_voice).toBe(true);
            return {
                ok: true,
                headers: {
                    get: (name) => name === 'content-type' ? 'audio/mpeg' : null
                },
                blob: async () => mockAudioBlob
            };
        };

        const result = await sendMessageWithVoice('Tell me a joke');
        expect(result).toBeInstanceOf(Blob);
    });

    it('should include voice_id when provided', async () => {
        global.fetch = async (url, options) => {
            const body = JSON.parse(options.body);
            expect(body.voice_id).toBe('voice-123');
            expect(body.enable_voice).toBe(true);
            return {
                ok: true,
                headers: {
                    get: () => 'application/json'
                },
                json: async () => ({
                    response: 'Test response'
                })
            };
        };

        await sendMessageWithVoice('Hello', null, 'voice-123');
    });

    it('should handle voice_error case returning both text response and error', async () => {
        global.fetch = async () => ({
            ok: true,
            headers: {
                get: () => 'application/json'
            },
            json: async () => ({
                response: 'Here is your answer in text',
                voice_error: 'Voice generation failed'
            })
        });

        const result = await sendMessageWithVoice('Hello');
        expect(result).toEqual({
            response: 'Here is your answer in text',
            voice_error: 'Voice generation failed'
        });
    });

    it('should return error for empty message', async () => {
        let fetchCalled = false;
        global.fetch = async () => {
            fetchCalled = true;
            return {
                ok: true,
                headers: {
                    get: () => 'application/json'
                },
                json: async () => ({})
            };
        };

        const result = await sendMessageWithVoice('');
        expect(result).toHaveProperty('error');
        expect(result.error).toBe('Message cannot be empty');
        expect(fetchCalled).toBe(false);
    });

    it('should return error for whitespace-only message', async () => {
        let fetchCalled = false;
        global.fetch = async () => {
            fetchCalled = true;
            return {
                ok: true,
                headers: {
                    get: () => 'application/json'
                },
                json: async () => ({})
            };
        };

        const result = await sendMessageWithVoice('   ');
        expect(result).toHaveProperty('error');
        expect(fetchCalled).toBe(false);
    });

    it('should handle network error', async () => {
        global.fetch = async () => {
            throw new Error('Network timeout');
        };

        const result = await sendMessageWithVoice('Hello');
        expect(result).toHaveProperty('error');
        expect(result.error).toBe('Network error: Network timeout');
    });

    it('should propagate backend error', async () => {
        global.fetch = async () => ({
            ok: false,
            json: async () => ({
                error: 'Voice service unavailable'
            })
        });

        const result = await sendMessageWithVoice('Hello');
        expect(result).toEqual({
            error: 'Voice service unavailable'
        });
    });
});


/**
 * Unit Tests for generateInvoice
 * _Requirements: 4.1, 4.2, 4.3, 4.4_
 */
describe('Unit Tests: generateInvoice', () => {
    const originalFetch = global.fetch;

    afterEach(() => {
        global.fetch = originalFetch;
    });

    const validItems = [{
            description: 'Web Development',
            quantity: 10,
            unit_price: 500
        },
        {
            description: 'Consulting',
            quantity: 5,
            unit_price: 800
        }
    ];

    it('should return invoice for valid data', async () => {
        const mockInvoice = {
            id: 'inv-123',
            invoice_number: 'INV-001',
            business_id: 'biz-456',
            client_name: 'Acme Corp',
            items: validItems,
            subtotal: 9000,
            vat_amount: 1350,
            total: 10350
        };

        global.fetch = async (url, options) => {
            expect(url).toBe('http://localhost:5000/api/invoice/generate');
            const body = JSON.parse(options.body);
            expect(body.business_id).toBe('biz-456');
            expect(body.client_name).toBe('Acme Corp');
            expect(body.items).toEqual(validItems);
            return {
                ok: true,
                json: async () => mockInvoice
            };
        };

        const result = await generateInvoice('biz-456', 'Acme Corp', validItems);
        expect(result).toEqual(mockInvoice);
    });

    it('should include optional fields when provided', async () => {
        global.fetch = async (url, options) => {
            const body = JSON.parse(options.body);
            expect(body.client_vat).toBe('VAT123456');
            expect(body.due_date).toBe('2025-01-15');
            return {
                ok: true,
                json: async () => ({
                    id: 'inv-123'
                })
            };
        };

        await generateInvoice('biz-456', 'Acme Corp', validItems, 'VAT123456', '2025-01-15');
    });

    it('should return error when business_id is missing', async () => {
        let fetchCalled = false;
        global.fetch = async () => {
            fetchCalled = true;
            return {
                ok: true,
                json: async () => ({})
            };
        };

        const result = await generateInvoice('', 'Acme Corp', validItems);
        expect(result).toHaveProperty('error');
        expect(result.error).toBe('business_id is required');
        expect(fetchCalled).toBe(false);
    });

    it('should return error when client_name is missing', async () => {
        let fetchCalled = false;
        global.fetch = async () => {
            fetchCalled = true;
            return {
                ok: true,
                json: async () => ({})
            };
        };

        const result = await generateInvoice('biz-456', '', validItems);
        expect(result).toHaveProperty('error');
        expect(result.error).toBe('client_name is required');
        expect(fetchCalled).toBe(false);
    });

    it('should return error when items is empty array', async () => {
        let fetchCalled = false;
        global.fetch = async () => {
            fetchCalled = true;
            return {
                ok: true,
                json: async () => ({})
            };
        };

        const result = await generateInvoice('biz-456', 'Acme Corp', []);
        expect(result).toHaveProperty('error');
        expect(result.error).toBe('items is required and must be a non-empty array');
        expect(fetchCalled).toBe(false);
    });

    it('should return error when items is not an array', async () => {
        let fetchCalled = false;
        global.fetch = async () => {
            fetchCalled = true;
            return {
                ok: true,
                json: async () => ({})
            };
        };

        const result = await generateInvoice('biz-456', 'Acme Corp', 'not an array');
        expect(result).toHaveProperty('error');
        expect(fetchCalled).toBe(false);
    });

    it('should propagate backend error', async () => {
        global.fetch = async () => ({
            ok: false,
            json: async () => ({
                error: 'Invalid invoice data'
            })
        });

        const result = await generateInvoice('biz-456', 'Acme Corp', validItems);
        expect(result).toEqual({
            error: 'Invalid invoice data'
        });
    });

    it('should handle network error', async () => {
        global.fetch = async () => {
            throw new Error('Server unreachable');
        };

        const result = await generateInvoice('biz-456', 'Acme Corp', validItems);
        expect(result).toHaveProperty('error');
        expect(result.error).toBe('Network error: Server unreachable');
    });
});


/**
 * Unit Tests for runSmartSQL
 * _Requirements: 5.1, 5.2, 5.3, 5.4_
 */
describe('Unit Tests: runSmartSQL', () => {
    const originalFetch = global.fetch;

    afterEach(() => {
        global.fetch = originalFetch;
    });

    it('should return sql and results for valid query', async () => {
        const mockResponse = {
            sql: 'SELECT * FROM invoices WHERE total > 1000',
            results: [{
                    id: 1,
                    total: 1500
                },
                {
                    id: 2,
                    total: 2000
                }
            ]
        };

        global.fetch = async (url, options) => {
            expect(url).toBe('http://localhost:5000/api/smartsql');
            const body = JSON.parse(options.body);
            expect(body.query).toBe('Show me invoices over R1000');
            return {
                ok: true,
                json: async () => mockResponse
            };
        };

        const result = await runSmartSQL('Show me invoices over R1000');
        expect(result).toEqual(mockResponse);
        expect(result.sql).toBe('SELECT * FROM invoices WHERE total > 1000');
        expect(result.results).toHaveLength(2);
    });

    it('should return error for empty query', async () => {
        let fetchCalled = false;
        global.fetch = async () => {
            fetchCalled = true;
            return {
                ok: true,
                json: async () => ({})
            };
        };

        const result = await runSmartSQL('');
        expect(result).toHaveProperty('error');
        expect(result.error).toBe('Query cannot be empty');
        expect(fetchCalled).toBe(false);
    });

    it('should return error for whitespace-only query', async () => {
        let fetchCalled = false;
        global.fetch = async () => {
            fetchCalled = true;
            return {
                ok: true,
                json: async () => ({})
            };
        };

        const result = await runSmartSQL('   \n\t  ');
        expect(result).toHaveProperty('error');
        expect(fetchCalled).toBe(false);
    });

    it('should propagate backend error', async () => {
        global.fetch = async () => ({
            ok: false,
            json: async () => ({
                error: 'Unable to parse query'
            })
        });

        const result = await runSmartSQL('gibberish query');
        expect(result).toEqual({
            error: 'Unable to parse query'
        });
    });

    it('should handle network error', async () => {
        global.fetch = async () => {
            throw new Error('DNS resolution failed');
        };

        const result = await runSmartSQL('Show all clients');
        expect(result).toHaveProperty('error');
        expect(result.error).toBe('Network error: DNS resolution failed');
    });

    it('should return fallback error when backend returns no error field', async () => {
        global.fetch = async () => ({
            ok: false,
            json: async () => ({})
        });

        const result = await runSmartSQL('Some query');
        expect(result).toEqual({
            error: 'Request failed'
        });
    });
});