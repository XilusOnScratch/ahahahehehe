import React, { useState, useEffect, useRef } from 'react';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

function TroubleshootPage() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showEmailInput, setShowEmailInput] = useState(false);
    const [email, setEmail] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput('');

        // Add user message to chat
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setIsLoading(true);

        try {
            const response = await fetch('https://aha-backend-ph63.onrender.com/api/namangpt/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: userMessage,
                    history: messages,
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // Check if bot is asking for email
            if (data.requestEmail) {
                setShowEmailInput(true);
            }

            // Add assistant message to chat
            setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
        } catch (error) {
            console.error('Error sending message:', error);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'oops something went wrong on my end... try again?'
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEmailSubmit = async () => {
        if (!email.trim() || isLoading) return;

        const userEmail = email.trim();
        setIsLoading(true);

        try {
            const response = await fetch('https://aha-backend-ph63.onrender.com/api/namangpt/verify-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: userEmail,
                    history: messages,
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // Add email as user message ONLY after we get a response
            setMessages(prev => [...prev, { role: 'user', content: userEmail }]);

            // Add assistant response
            setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);

            if (data.verified) {
                setShowEmailInput(false);
                setEmail('');
            } else {
                // Keep showEmailInput as true so they can try again
                setEmail('');
            }
        } catch (error) {
            console.error('Error verifying email:', error);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'hmm something broke... try again?'
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (showEmailInput) {
                handleEmailSubmit();
            } else {
                handleSendMessage();
            }
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: '#F5EEE6', // Stage 3 cream background
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            fontFamily: "'Georgia', 'Times New Roman', serif",
            color: '#5a4a3a',
        }}>
            <div style={{
                width: '100%',
                maxWidth: '800px',
                height: '80vh',
                display: 'flex',
                flexDirection: 'column',
            }}>
                {/* Chat Area */}
                <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '20px',
                    marginBottom: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: messages.length === 0 ? 'center' : 'flex-start',
                }}>
                    {messages.length === 0 ? (
                        <div style={{ textAlign: 'center' }}>
                            <div style={{
                                fontSize: '2.5rem',
                                color: '#8B7355',
                                fontWeight: '300',
                                opacity: 0.8,
                            }}>
                                watchu need help with?
                            </div>
                            <div style={{
                                fontSize: '0.9rem',
                                color: '#8B7355',
                                opacity: 0.5,
                                marginTop: '10px',
                                fontFamily: "'Courier New', Courier, monospace",
                            }}>
                                namangpt
                            </div>
                        </div>
                    ) : (
                        <>
                            {messages.map((msg, idx) => (
                                <div
                                    key={idx}
                                    style={{
                                        marginBottom: '15px',
                                        textAlign: msg.role === 'user' ? 'right' : 'left',
                                    }}
                                >
                                    {msg.role === 'assistant' && (
                                        <div style={{
                                            fontSize: '0.75rem',
                                            color: '#8B7355',
                                            opacity: 0.5,
                                            marginBottom: '4px',
                                            marginLeft: '12px',
                                            fontFamily: "'Courier New', Courier, monospace",
                                        }}>
                                            namangpt
                                        </div>
                                    )}
                                    <div
                                        style={{
                                            display: 'inline-block',
                                            maxWidth: '70%',
                                            padding: '12px 18px',
                                            borderRadius: '18px',
                                            backgroundColor: msg.role === 'user' ? '#E8DCC4' : '#FAF9F6',
                                            color: '#5a4a3a',
                                            border: msg.role === 'assistant' ? '1px solid #D4C4A8' : 'none',
                                            fontSize: '1rem',
                                            lineHeight: '1.5',
                                            whiteSpace: 'pre-wrap',
                                            wordBreak: 'break-word',
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                                        }}
                                    >
                                        {msg.content}
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div style={{ textAlign: 'left', marginBottom: '15px' }}>
                                    <div style={{
                                        fontSize: '0.75rem',
                                        color: '#8B7355',
                                        opacity: 0.5,
                                        marginBottom: '4px',
                                        marginLeft: '12px',
                                        fontFamily: "'Courier New', Courier, monospace",
                                    }}>
                                        namangpt
                                    </div>
                                    <div
                                        style={{
                                            display: 'inline-block',
                                            padding: '12px 18px',
                                            borderRadius: '18px',
                                            backgroundColor: '#FAF9F6',
                                            color: '#5a4a3a',
                                            border: '1px solid #D4C4A8',
                                            fontSize: '1rem',
                                        }}
                                    >
                                        typing...
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </>
                    )}
                </div>

                {/* Input Area - Always Visible now */}
                <div style={{
                    display: 'flex',
                    gap: '10px',
                    padding: '0 20px 20px',
                }}>
                    <input
                        type="text"
                        value={showEmailInput ? email : input}
                        onChange={(e) => showEmailInput ? setEmail(e.target.value) : setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder={showEmailInput ? "enter ur email..." : "type ur message..."}
                        disabled={isLoading}
                        style={{
                            flex: 1,
                            padding: '15px 20px',
                            borderRadius: '25px',
                            border: '2px solid #A69076',
                            backgroundColor: '#FAF9F6',
                            fontSize: '1rem',
                            color: '#5a4a3a',
                            outline: 'none',
                            fontFamily: "'Georgia', 'Times New Roman', serif",
                        }}
                        autoFocus
                    />
                    <button
                        onClick={showEmailInput ? handleEmailSubmit : handleSendMessage}
                        disabled={isLoading || (showEmailInput ? !email.trim() : !input.trim())}
                        style={{
                            padding: '15px 30px',
                            borderRadius: '25px',
                            border: 'none',
                            backgroundColor: '#8B7355',
                            color: '#FFFFFF',
                            fontSize: '1rem',
                            cursor: isLoading ? 'not-allowed' : 'pointer',
                            fontFamily: "'Georgia', 'Times New Roman', serif',",
                            opacity: isLoading || (showEmailInput ? !email.trim() : !input.trim()) ? 0.5 : 1,
                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                            transition: 'all 0.2s',
                        }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#6B5B4F'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#8B7355'}
                    >
                        send
                    </button>
                </div>
            </div>
        </div>
    );
}

export default TroubleshootPage;
