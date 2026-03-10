// Solar AI Chatbot with RAG
// API Configuration - Auto-detects environment
const API_BASE_URL = 'ki-bharat-solar-gqxb.vercel.app'; // Replace with your actual backend URL

console.log('🌐 Using API URL:', API_BASE_URL);
class SolarChatbot {
    constructor() {
        this.messages = [];
        this.leadCollection = false;
        this.leadStep = 0;
        this.leadData = {};
        this.pendingRecommendation = null;
        this.apiUrl = 'http://127.0.0.1:8000';
        this.knowledgeBase = [];
        this.faqData = [];
        
        window.chatbot = this;
    }
    
    async init() {
        await this.loadKnowledgeBase();
        this.addMessage("👋 Hi! I'm your Solar Assistant. Ask me about products and recommendations!", 'bot');
    }
    
    async loadKnowledgeBase() {
        try {
            const faqResponse = await fetch('/data/faq.json');
            this.faqData = await faqResponse.json();
            
            const knowledgeResponse = await fetch('/data/solar_knowledge.json');
            this.knowledgeBase = await knowledgeResponse.json();
        } catch (error) {
            console.error('Error loading knowledge base:', error);
        }
    }
    
    addMessage(text, sender) {
        this.messages.push({ text, sender });
        this.displayMessages();
    }
    
    displayMessages() {
        const messagesContainer = document.getElementById('chatMessages');
        if (!messagesContainer) return;
        
        messagesContainer.innerHTML = '';
        this.messages.forEach(msg => {
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${msg.sender}`;
            messageDiv.innerHTML = `<div class="message-content">${msg.text}</div>`;
            messagesContainer.appendChild(messageDiv);
        });
        
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    showTyping() {
        const messagesContainer = document.getElementById('chatMessages');
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message bot';
        typingDiv.id = 'typing-indicator';
        typingDiv.innerHTML = `
            <div class="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
            </div>
        `;
        messagesContainer.appendChild(typingDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    hideTyping() {
        const typing = document.getElementById('typing-indicator');
        if (typing) typing.remove();
    }
    
    async processInput(input) {
        input = input.toLowerCase().trim();
        
        if (this.leadCollection) {
            this.handleLeadCollection(input);
            return;
        }
        
        const answer = await this.getAnswer(input);
        
        if (answer) {
            this.addMessage(answer, 'bot');
            this.pendingRecommendation = answer;
            
            setTimeout(() => {
                this.addMessage("Would you like to confirm our service? I can collect your details and our team will contact you.", 'bot');
                this.addMessage("Type 'yes' to proceed or ask another question.", 'bot');
            }, 1000);
        } else {
            this.addMessage("I couldn't find specific information about that. Would you like to speak with our team?", 'bot');
        }
    }
    
    async getAnswer(input) {
        if (input.includes('pump') || input.includes('land') || input.includes('acre')) {
            return this.getPumpRecommendation(input);
        }
        
        if (input.includes('price') || input.includes('cost')) {
            return this.getPriceInfo(input);
        }
        
        const faqAnswer = this.searchFAQ(input);
        if (faqAnswer) {
            return faqAnswer;
        }
        
        const ragAnswer = await this.searchRAG(input);
        if (ragAnswer) {
            return ragAnswer;
        }
        
        return null;
    }
    
    getPumpRecommendation(input) {
        const numbers = input.match(/\d+/g);
        if (numbers) {
            for (const num of numbers) {
                const acres = parseInt(num);
                if (acres <= 4) {
                    return "📋 **Solar Pump Recommendation**\n\n✅ **3HP Solar Pump**\n• 💰 Price: ₹1.5 Lakh\n• 🔋 Panels: 6 solar panels\n• 💧 Output: 1,00,000 L/day\n• 🌾 Suitable for: 2-4 acres";
                } else if (acres <= 8) {
                    return "📋 **Solar Pump Recommendation**\n\n✅ **5HP Solar Pump**\n• 💰 Price: ₹2.2 Lakh\n• 🔋 Panels: 10 solar panels\n• 💧 Output: 1,80,000 L/day\n• 🌾 Suitable for: 4-8 acres";
                } else {
                    return "📋 **Solar Pump Recommendation**\n\n✅ **7.5HP Solar Pump**\n• 💰 Price: ₹3.5 Lakh\n• 🔋 Panels: 15 solar panels\n• 💧 Output: 2,50,000 L/day\n• 🌾 Suitable for: 8+ acres";
                }
            }
        }
        return "To recommend the right pump, please tell me your land size in acres.";
    }
    
    getPriceInfo(input) {
        if (input.includes('pump')) {
            return "💰 **Solar Pump Prices**\n\n• 3HP: ₹1.5 Lakh\n• 5HP: ₹2.2 Lakh\n• 7.5HP: ₹3.5 Lakh";
        }
        if (input.includes('panel') || input.includes('system')) {
            return "💰 **Solar System Prices**\n\n• 1kW: ₹70,000 - ₹90,000\n• 2kW: ₹1,30,000 - ₹1,60,000\n• 3kW: ₹1,90,000 - ₹2,40,000\n• 5kW+: ₹3,00,000+";
        }
        return "Please specify if you want pump prices or solar system prices.";
    }
    
    searchFAQ(input) {
        for (const faq of this.faqData) {
            if (faq.keywords) {
                for (const keyword of faq.keywords) {
                    if (input.includes(keyword.toLowerCase())) {
                        return faq.answer;
                    }
                }
            }
        }
        return null;
    }
    
    async searchRAG(input) {
        try {
            const allKnowledge = [
                ...this.knowledgeBase.products_knowledge || [],
                ...this.knowledgeBase.technical_knowledge || [],
                ...this.knowledgeBase.process_knowledge || []
            ];
            
            for (const item of allKnowledge) {
                if (input.includes(item.topic.toLowerCase())) {
                    return item.details;
                }
            }
            return null;
        } catch (error) {
            console.error('RAG error:', error);
            return null;
        }
    }
    
    startLeadCollection() {
        this.leadCollection = true;
        this.leadStep = 1;
        this.leadData = {};
        this.leadData.recommendation = this.pendingRecommendation;
        this.addMessage("Great! Please provide your details so our team can contact you:", 'bot');
        this.addMessage("1️⃣ Your Name:", 'bot');
    }
    
    handleLeadCollection(input) {
        if (input === 'yes' || input === 'ok' || input === 'sure' || input === 'confirm') {
            this.startLeadCollection();
            return;
        }
        
        switch(this.leadStep) {
            case 1:
                this.leadData.name = input;
                this.leadStep = 2;
                this.addMessage("2️⃣ Your Phone Number:", 'bot');
                break;
                
            case 2:
                this.leadData.phone = input;
                this.leadStep = 3;
                this.addMessage("3️⃣ Your Location (District):", 'bot');
                break;
                
            case 3:
                this.leadData.location = input;
                this.leadStep = 4;
                this.addMessage("4️⃣ Land Size (in acres):", 'bot');
                break;
                
            case 4:
                this.leadData.land_size = input;
                this.leadStep = 5;
                this.addMessage("5️⃣ Borewell Depth (in feet):", 'bot');
                break;
                
            case 5:
                this.leadData.borewell_depth = input;
                this.leadData.timestamp = new Date().toISOString();
                this.leadData.source = 'Chatbot';
                this.saveLead(this.leadData);
                
                this.addMessage(`✅ Thank you ${this.leadData.name}! Our team will contact you soon at 📞 ${this.leadData.phone}`, 'bot');
                
                this.leadCollection = false;
                this.leadStep = 0;
                this.pendingRecommendation = null;
                break;
        }
    }
    
    async saveLead(leadData) {
        try {
            const response = await fetch(`${this.apiUrl}/api/lead`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(leadData)
            });
            
            if (response.ok) {
                console.log('✅ Lead saved successfully');
            }
        } catch (error) {
            console.error('❌ Error saving lead:', error);
        }
    }
}

let chatbot;

function toggleChatbot() {
    const box = document.getElementById('chatbotBox');
    box.classList.toggle('open');
    
    if (!chatbot) {
        chatbot = new SolarChatbot();
        chatbot.init();
    }
}

async function sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    input.value = '';
    chatbot.addMessage(message, 'user');
    chatbot.showTyping();
    
    setTimeout(async () => {
        chatbot.hideTyping();
        await chatbot.processInput(message);
    }, 1000);
}

document.addEventListener('DOMContentLoaded', function() {
    const chatInput = document.getElementById('chatInput');
    if (chatInput) {
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }
});