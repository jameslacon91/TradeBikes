import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, MinusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// Types for our chat messages
interface Message {
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

// Initial greeting messages from the bot
const initialMessages: Message[] = [
  {
    text: 'Hello! I\'m your TradeBikes assistant. How can I help you with motorcycle trading today?',
    sender: 'bot',
    timestamp: new Date()
  }
];

// Common questions that users might ask
const commonQuestions = [
  'How do I list a motorcycle?',
  'How do I place a bid?',
  'What happens after I accept a bid?', 
  'How do I arrange collection?',
  'How do I contact another dealer?'
];

const ChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [newMessage, setNewMessage] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the bottom when new messages are added
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Function to simulate the AI typing and responding
  const simulateResponse = (userMessage: string) => {
    // Set typing indicator
    setIsTyping(true);
    
    setTimeout(() => {
      let response: string;
      
      // Simple keyword matching for demo purposes
      const lowerCaseMessage = userMessage.toLowerCase();
      
      if (lowerCaseMessage.includes('list') || lowerCaseMessage.includes('sell')) {
        response = 'To list a motorcycle, go to your dashboard and click "List a Bike". Fill in all the required details about your motorcycle and set your reserve price.';
      } else if (lowerCaseMessage.includes('bid') || lowerCaseMessage.includes('offer')) {
        response = 'To place a bid, browse active listings and click on a motorcycle you\'re interested in. Enter your bid amount and submit. Remember, the selling dealer won\'t see other bids.';
      } else if (lowerCaseMessage.includes('accept') || lowerCaseMessage.includes('winning')) {
        response = 'When you accept a bid, the buyer will be notified. You\'ll then need to confirm collection details through the "Pending Completion" tab.';
      } else if (lowerCaseMessage.includes('collection') || lowerCaseMessage.includes('pickup')) {
        response = 'After a bid is accepted, arrange collection details through the messaging system. Once the motorcycle has been collected, mark it as "Collection Confirmed" in the system.';
      } else if (lowerCaseMessage.includes('contact') || lowerCaseMessage.includes('message')) {
        response = 'You can contact other dealers through the messaging tab. Select the dealer you want to contact and write your message.';
      } else if (lowerCaseMessage.includes('hello') || lowerCaseMessage.includes('hi')) {
        response = 'Hello! How can I help you with TradeBikes today?';
      } else if (lowerCaseMessage.includes('thank')) {
        response = 'You\'re welcome! Is there anything else I can help you with?';
      } else {
        response = 'I\'m not sure I understand. Could you rephrase your question? Or select from one of the common questions below.';
      }
      
      // Add the bot response to messages
      setMessages(prev => [
        ...prev,
        {
          text: response,
          sender: 'bot',
          timestamp: new Date()
        }
      ]);
      
      // Remove typing indicator
      setIsTyping(false);
    }, 1000); // Simulate 1 second of "thinking" time
  };

  // Handle sending a new message
  const handleSendMessage = () => {
    if (newMessage.trim() === '') return;
    
    // Add user message
    const userMessage = {
      text: newMessage,
      sender: 'user' as const,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    // Clear the input
    setNewMessage('');
    
    // Simulate bot response
    simulateResponse(newMessage);
  };

  // Handle suggested question click
  const handleQuestionClick = (question: string) => {
    // Add the question as a user message
    const userMessage = {
      text: question,
      sender: 'user' as const,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    // Simulate bot response
    simulateResponse(question);
  };

  // Handle key press (Enter to send)
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-[9999]" data-chat-widget="react">
      {/* Chat bubble button */}
      {!isOpen && (
        <button
          className="flex items-center justify-center bg-primary text-white rounded-full p-4 shadow-xl hover:bg-primary/90 transition-all"
          onClick={() => {
            setIsOpen(true);
            setIsMinimized(false);
          }}
        >
          <MessageSquare className="w-6 h-6" />
        </button>
      )}

      {/* Chat window */}
      {isOpen && (
        <div className={`flex flex-col bg-background border border-border rounded-lg shadow-xl overflow-hidden transition-all duration-200 ${isMinimized ? 'h-14 w-80' : 'h-[500px] w-80'}`}>
          {/* Chat header */}
          <div className="flex items-center justify-between bg-primary text-white p-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              <h3 className="font-semibold">TradeBikes Support</h3>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setIsMinimized(!isMinimized)}
                className="hover:text-gray-200 transition-colors"
              >
                <MinusCircle className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setIsOpen(false)}
                className="hover:text-gray-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages container */}
              <div className="flex-1 p-3 overflow-y-auto bg-secondary/20">
                {messages.map((message, index) => (
                  <div 
                    key={index} 
                    className={`mb-3 ${message.sender === 'user' ? 'text-right' : ''}`}
                  >
                    <div 
                      className={`inline-block rounded-lg py-2 px-3 max-w-[80%] ${
                        message.sender === 'user' 
                          ? 'bg-primary text-white' 
                          : 'bg-secondary text-foreground'
                      }`}
                    >
                      {message.text}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))}
                
                {/* Typing indicator */}
                {isTyping && (
                  <div className="mb-3">
                    <div className="inline-block bg-secondary text-foreground rounded-lg py-2 px-3">
                      <div className="flex space-x-1">
                        <div className="h-2 w-2 bg-primary/60 rounded-full animate-bounce"></div>
                        <div className="h-2 w-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        <div className="h-2 w-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Empty div for auto-scroll reference */}
                <div ref={messagesEndRef} />
              </div>

              {/* Suggested questions */}
              <div className="p-2 border-t border-border bg-background">
                <p className="text-xs text-muted-foreground mb-1">Common Questions:</p>
                <div className="flex flex-wrap gap-1">
                  {commonQuestions.map((question, index) => (
                    <button
                      key={index}
                      className="text-xs bg-secondary/40 hover:bg-secondary px-2 py-1 rounded-full text-foreground"
                      onClick={() => handleQuestionClick(question)}
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message input */}
              <div className="p-3 border-t border-border bg-background">
                <div className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Type your message..."
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={newMessage.trim() === ''}
                    size="icon"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatWidget;