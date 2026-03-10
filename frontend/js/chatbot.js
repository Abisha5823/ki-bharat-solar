// Solar AI Chatbot with RAG

// API Configuration
const API_BASE_URL = "https://ki-bharat-solar-gqxb.vercel.app";

console.log("🌐 Using API URL:", API_BASE_URL);

class SolarChatbot {
    constructor() {
        this.messages = [];
        this.leadCollection = false;
        this.leadStep = 0;
        this.leadData = {};
        this.pendingRecommendation = null;

        // FIXED: Use deployed backend instead of localhost
        this.apiUrl = API_BASE_URL;

        this.knowledgeBase = [];
        this.faqData = [];

        window.chatbot = this;
    }

    async init() {
        await this.loadKnowledgeBase();
        this.addMessage(
            "👋 Hi! I'm your Solar Assistant. Ask me about solar pumps, prices or recommendations!",
            "bot"
        );
    }

    async loadKnowledgeBase() {
        try {
            const faqResponse = await fetch("/data/faq.json");
            this.faqData = await faqResponse.json();

            const knowledgeResponse = await fetch("/data/solar_knowledge.json");
            this.knowledgeBase = await knowledgeResponse.json();
        } catch (error) {
            console.error("Error loading knowledge base:", error);
        }
    }

    addMessage(text, sender) {
        this.messages.push({ text, sender });
        this.displayMessages();
    }

    displayMessages() {
        const container = document.getElementById("chatMessages");
        if (!container) return;

        container.innerHTML = "";

        this.messages.forEach((msg) => {
            const div = document.createElement("div");
            div.className = `message ${msg.sender}`;
            div.innerHTML = `<div class="message-content">${msg.text}</div>`;
            container.appendChild(div);
        });

        container.scrollTop = container.scrollHeight;
    }

    showTyping() {
        const container = document.getElementById("chatMessages");

        const typing = document.createElement("div");
        typing.className = "message bot";
        typing.id = "typing-indicator";

        typing.innerHTML = `
            <div class="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
            </div>
        `;

        container.appendChild(typing);
        container.scrollTop = container.scrollHeight;
    }

    hideTyping() {
        const typing = document.getElementById("typing-indicator");
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
            this.addMessage(answer, "bot");
            this.pendingRecommendation = answer;

            setTimeout(() => {
                this.addMessage(
                    "Would you like our team to contact you? Type **yes** to continue.",
                    "bot"
                );
            }, 1000);
        } else {
            this.addMessage(
                "I couldn't find that information. Our team can help you further.",
                "bot"
            );
        }
    }

    async getAnswer(input) {
        if (input.includes("pump") || input.includes("acre")) {
            return this.getPumpRecommendation(input);
        }

        if (input.includes("price") || input.includes("cost")) {
            return this.getPriceInfo(input);
        }

        const faqAnswer = this.searchFAQ(input);
        if (faqAnswer) return faqAnswer;

        const ragAnswer = await this.searchRAG(input);
        if (ragAnswer) return ragAnswer;

        return null;
    }

    getPumpRecommendation(input) {
        const numbers = input.match(/\d+/g);

        if (!numbers) {
            return "Please tell me your **land size in acres** so I can recommend the right pump.";
        }

        const acres = parseInt(numbers[0]);

        if (acres <= 4) {
            return `📋 **Solar Pump Recommendation**

✅ **3HP Solar Pump**
💰 Price: ₹1.5 Lakh  
🔋 Panels: 6 panels  
💧 Output: 1,00,000 L/day  
🌾 Suitable for: 2-4 acres`;
        }

        if (acres <= 8) {
            return `📋 **Solar Pump Recommendation**

✅ **5HP Solar Pump**
💰 Price: ₹2.2 Lakh  
🔋 Panels: 10 panels  
💧 Output: 1,80,000 L/day  
🌾 Suitable for: 4-8 acres`;
        }

        return `📋 **Solar Pump Recommendation**

✅ **7.5HP Solar Pump**
💰 Price: ₹3.5 Lakh  
🔋 Panels: 15 panels  
💧 Output: 2,50,000 L/day  
🌾 Suitable for: 8+ acres`;
    }

    getPriceInfo(input) {
        if (input.includes("pump")) {
            return `💰 **Solar Pump Prices**

3HP : ₹1.5 Lakh  
5HP : ₹2.2 Lakh  
7.5HP : ₹3.5 Lakh`;
        }

        if (input.includes("panel") || input.includes("system")) {
            return `💰 **Solar System Prices**

1kW : ₹70k – ₹90k  
2kW : ₹1.3L – ₹1.6L  
3kW : ₹1.9L – ₹2.4L  
5kW+ : ₹3L+`;
        }

        return "Please ask about **pump price** or **solar system price**.";
    }

    searchFAQ(input) {
        for (const faq of this.faqData) {
            if (!faq.keywords) continue;

            for (const keyword of faq.keywords) {
                if (input.includes(keyword.toLowerCase())) {
                    return faq.answer;
                }
            }
        }
        return null;
    }

    async searchRAG(input) {
        try {
            const allKnowledge = [
                ...(this.knowledgeBase.products_knowledge || []),
                ...(this.knowledgeBase.technical_knowledge || []),
                ...(this.knowledgeBase.process_knowledge || []),
            ];

            for (const item of allKnowledge) {
                if (input.includes(item.topic.toLowerCase())) {
                    return item.details;
                }
            }

            return null;
        } catch (error) {
            console.error("RAG error:", error);
            return null;
        }
    }

    startLeadCollection() {
        this.leadCollection = true;
        this.leadStep = 1;
        this.leadData = {};

        this.addMessage("Please enter your **Name**:", "bot");
    }

    handleLeadCollection(input) {
        switch (this.leadStep) {
            case 1:
                this.leadData.name = input;
                this.leadStep = 2;
                this.addMessage("Your **Phone Number**:", "bot");
                break;

            case 2:
                this.leadData.phone = input;
                this.leadStep = 3;
                this.addMessage("Your **Location**:", "bot");
                break;

            case 3:
                this.leadData.location = input;

                this.saveLead(this.leadData);

                this.addMessage(
                    `✅ Thank you ${this.leadData.name}! Our team will contact you soon.`,
                    "bot"
                );

                this.leadCollection = false;
                this.leadStep = 0;
                break;
        }
    }

    async saveLead(leadData) {
        try {
            const response = await fetch(`${this.apiUrl}/api/lead`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(leadData),
            });

            if (response.ok) {
                console.log("✅ Lead saved");
            } else {
                console.error("❌ Lead save failed");
            }
        } catch (error) {
            console.error("❌ API error:", error);
        }
    }
}

let chatbot;

function toggleChatbot() {
    const box = document.getElementById("chatbotBox");

    if (!box) return;

    box.classList.toggle("open");

    if (!chatbot) {
        chatbot = new SolarChatbot();
        chatbot.init();
    }
}

async function sendMessage() {
    const input = document.getElementById("chatInput");

    if (!input) return;

    const message = input.value.trim();
    if (!message) return;

    input.value = "";

    chatbot.addMessage(message, "user");
    chatbot.showTyping();

    setTimeout(async () => {
        chatbot.hideTyping();
        await chatbot.processInput(message);
    }, 800);
}

document.addEventListener("DOMContentLoaded", () => {
    const input = document.getElementById("chatInput");

    if (input) {
        input.addEventListener("keypress", (e) => {
            if (e.key === "Enter") sendMessage();
        });
    }
});
