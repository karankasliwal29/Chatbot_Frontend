import React, { useState, useEffect } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

const App = () => {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [voices, setVoices] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  
  useEffect(() => {
    const fetchVoices = () => {
      const availableVoices = speechSynthesis.getVoices();
      setVoices(availableVoices);
    };
    
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = fetchVoices;
    } else {
      fetchVoices();
    }
  }, []);

  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.lang = "en-US";
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onstart = () => {
    setIsRecording(true);
  };

  recognition.onend = () => {
    setIsRecording(false);
  };

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    setQuery(transcript);
    
    // ✅ Automatically send the message after 1 second
    setTimeout(() => {
      handleSendMessage(transcript);
    }, 1000);
  };

  const handleStartRecording = () => {
    recognition.start();
  };

  const handleSendMessage = async (text) => {
    if (!text.trim()) return;
    
    setMessages([...messages, { sender: 'user', text }]);
    setQuery('');
    setLoading(true);
    
    try {
      const res = await axios.post('https://chatbot-backend-ijmi.onrender.com/get-answer', { query: text });
      const answer = res.data.answer || 'No response received.';
      setMessages([...messages, { sender: 'user', text }, { sender: 'bot', text: answer }]);
      playAudio(answer);
    } catch (error) {
      console.error('Error fetching response:', error);
      setMessages([...messages, { sender: 'bot', text: 'An error occurred while fetching the response.' }]);
    } finally {
      setLoading(false);
    }
  };

  const playAudio = (text) => {
    window.speechSynthesis.cancel();
    const selectedVoice = voices.find(voice => voice.name === 'hi-IN-Neural2-D') || voices.find(voice => voice.name === 'en-IN-Journey-O');
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = selectedVoice || voices[169];
    utterance.pitch = 1;
    utterance.rate = 1;
    speechSynthesis.speak(utterance);
  };

  return (
    <div className="container vh-100 d-flex flex-column justify-content-between">
      {/* Header */}
      <div className="row">
        <div className="col text-white bg-primary py-3 rounded-top d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Support Bot</h5>
          <div>
            <i className="bi bi-gear-fill me-3"></i>
            <i className="bi bi-person-circle"></i>
          </div>
        </div>
      </div>
      {/* Chat Body */}
      <div className="row flex-grow-1 overflow-auto bg-light p-3">
        <div className="col">
          {messages.map((msg, index) => (
            <div key={index} className={`d-flex ${msg.sender === "user" ? "justify-content-end" : "justify-content-start"} mb-3`}>
              <div className={`p-3 rounded-3 ${msg.sender === "user" ? "bg-success text-white" : "bg-secondary text-white"}`} style={{ maxWidth: "70%" }}>
                {msg.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="d-flex justify-content-start">
              <div className="p-3 bg-secondary text-white rounded-3" style={{ maxWidth: "70%" }}>
                Typing...
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Footer */}
      <div className="row">
        <div className="col d-flex p-3 bg-white border-top">
          <input
            type="text"
            className="form-control me-2"
            placeholder="Type a message"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage(query)}
          />
          <button className="btn btn-primary" onClick={() => handleSendMessage(query)}>Send</button>
          <button
            className={`btn ${isRecording ? "btn-danger" : "btn-secondary"} ms-2 d-flex align-items-center`}
            onClick={handleStartRecording}
          >
            {isRecording ? <><i className="bi bi-mic-mute-fill me-2"></i> Stop</> : <><i className="bi bi-mic-fill me-2"></i> Audio</>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;