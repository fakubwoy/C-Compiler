import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import './Chatbot.css';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const newMessage = { text: inputMessage, sender: 'user' };
    setMessages(prev => [...prev, newMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      const response = await fetch('http://localhost:5000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: inputMessage }),
      });

      const data = await response.json();
      setIsTyping(false);
      setMessages(prev => [...prev, { text: data.reply, sender: 'bot' }]);
    } catch (error) {
      console.error('Error sending message:', error);
      setIsTyping(false);
      setMessages(prev => [...prev, { 
        text: "Sorry, I'm having trouble connecting right now.", 
        sender: 'bot' 
      }]);
    }
  };

  return (
    <div className="chatbot-container">
      <button
        className="chat-toggle-btn"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>

      {isOpen && (
        <div className="chat-window">
          <div className="chat-header">
            CompChat
          </div>

          <div className="messages-container">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`message ${message.sender}`}
              >
                <div className="message-content">
                  {message.text}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="message bot">
                <div className="typing-indicator">
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input-container">
            <input
              type="text"
              className="chat-input"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type your message..."
            />
            <button
              className="send-button"
              onClick={handleSendMessage}
            >
              <img id='send'src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAYAAADimHc4AAAACXBIWXMAAAsTAAALEwEAmpwYAAAEH0lEQVR4nO2dyWsUQRSHK5rFuEVMEMUFxYs7LlGIy0U8KOIpCh7Em+JJDwoeVBC8eFRz8iCiB/8Ac/AQj4IeRFyCiEKiJm644YILaj5p8gJjZ6Z74lR3dXW/D3LKzFT1e9316lev6rUxiqIoiqIoiqIoNQBMBY4D/cAgcAqYoUZNGGAycBR4z2h+ApeBxUn3o3DEGD7MH6Ab2OC630UzfDluA3uB8a6vxTuAHTGGD/53AjgI9MU44hGwD5jg+rq8AXgZYfggAE8t+Ww9sFvu+CheA8eA6W6vzgOAz3GGr/C9zcA1YCjCEV+AM8D89K7IM4AHIaN1jPH7y4FLMjuqxC/gCrA6uSvxFJnJlNL5n78zEzgJfCCaGxJ36uxfjYcAXSEDHa7x96YAh4DnMY64D+wvfMAGjoQMc86SYxtkahoe4sK8kidnmikiwM6QQa4m0MbGMkNdmGAycBaYY4oE0B4eGhJsa6UsYwRBuRIjSx3LTBEA2sJ3Ygptzpe7/Ws1AdsUUAu0ptRuiwTsFzGOuCPxpN7kkTKBck3K7TeJgR/GOKJPHDbJ5AlbWqBWgHGiEYKhJ4q3wGlglskDtrWADYKnUILx7whH/JDPLDI+k5QWsAGwUAL2typyE+uNj6ShBWolSIWKYHsXMzwFw9cur3ITaWqBWgkCsCxhPI5xxBMJ2M0m67jQAhYD9q0YR7yRJyfbuQlXWsDyUkdcbiKIJfNMFnGtBWwguYnzwPcqAvY6kyWyogVsUJKb+OhNbiKLWqBWSnITAzGOuCtKvMFlZzOrBWoFaKwyN/HSWW7CBy2QYm7ikwTs2Wl2zBstYANg1RhyE0vS6JB3WsAGwIIqchND8tRsSboz3mqBFHMTgSPmJtWJcJBqNwUDaAYOyFJG1EYC+5vNygSnnaagMLzU0QncrOCEXuvT1jxqARsAm4CeMk7YY7uhw6EGuqw24DnAhZB9emw3EDxypXRbbSAfM6ZSBpNIA/pKP7DNqkFG26cu1OaQ7QZa8ZsBqwYpb6N/sP3j6gDHDvB5COoDtlo1iIMhSIOw4yCs09Dou/9i0tNQFWKVhdj1NISYLkU4XorQxTjcLsYVeTm6TaoFVDo3PUJ3Iqd4NCGD24SMpiTdpyQ1Ke84KV+EbSm9RPNU4kCLi07mTgPg2cYs3Zrokpxszl0hm3ODo0txm3PXmizhswbA9+3pPmoA8nRAwycNwHB9u9wdUcq8BiDnh/Tycky1w/hIFjUABTuonQkNQIFLFfhWrGOiyRNarsYhGS7YNCQbYvNdsCnDJcuWmiKgRfvyW7ayUctWZrtw6z1ZUmgyRUZLFztGi3c7RsvXO0Zf4OAYYLu+wsQx+hKfjKCvsfLDESNr8PoitxRfZfhM/vRVhoqiKIqiKIqiKIqiKIpihvkLrqfQ3PI1L4MAAAAASUVORK5CYII="></img>
              <Send size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chatbot;