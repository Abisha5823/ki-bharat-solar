# Advanced chatbot logic - can be imported in main.py
import json
import re
from difflib import get_close_matches

class SolarChatbotEngine:
    def __init__(self, data_path='../data/'):
        self.data_path = data_path
        self.load_data()
    
    def load_data(self):
        try:
            with open(f'{self.data_path}faq.json', 'r') as f:
                self.faq = json.load(f)
            with open(f'{self.data_path}solar_knowledge.json', 'r') as f:
                self.knowledge = json.load(f)
        except:
            self.faq = []
            self.knowledge = {}
    
    def get_response(self, query):
        query = query.lower()
        
        # Check for price queries
        if re.search(r'price|cost|rate', query):
            return self.get_price_info(query)
        
        # Check for pump recommendations
        if re.search(r'pump.*(hp|size|land|acre)', query):
            return self.get_pump_recommendation(query)
        
        # Check FAQ
        for item in self.faq:
            if isinstance(item, dict):
                if 'keywords' in item:
                    for keyword in item['keywords']:
                        if keyword in query:
                            return item.get('answer', '')
                if 'question' in item and item['question'] in query:
                    return item.get('answer', '')
        
        return "I'll connect you with our team for more details. Please share your phone number."
    
    def get_price_info(self, query):
        if 'pump' in query:
            return """Solar Pump Prices:
• 3HP Solar Pump: ₹1.5 Lakh (6 panels)
• 5HP Solar Pump: ₹2.2 Lakh (10 panels)
• 7.5HP Solar Pump: ₹3.5 Lakh (15 panels)

Includes panels, pump, controller and installation."""
        
        elif 'panel' in query or 'system' in query:
            return """Solar System Prices:
• 1kW System: ₹70,000 - ₹90,000
• 2kW System: ₹1,30,000 - ₹1,60,000
• 3kW System: ₹1,90,000 - ₹2,40,000
• 5kW+ System: ₹3,00,000+

Government subsidy available on selected systems."""
        
        return "Please specify if you want pump prices or solar system prices."
    
    def get_pump_recommendation(self, query):
        # Extract numbers
        numbers = re.findall(r'\d+', query)
        
        if numbers:
            land_size = int(numbers[0])
            if land_size <= 4:
                return """✅ Recommended: 3HP Solar Pump
• Price: ₹1.5 Lakh
• Panels: 6 units
• Output: 1,00,000 L/day
• Suitable for 2-4 acres"""
            elif land_size <= 8:
                return """✅ Recommended: 5HP Solar Pump
• Price: ₹2.2 Lakh
• Panels: 10 units
• Output: 1,80,000 L/day
• Suitable for 4-8 acres"""
            else:
                return """✅ Recommended: 7.5HP Solar Pump
• Price: ₹3.5 Lakh
• Panels: 15 units
• Output: 2,50,000 L/day
• Suitable for 8+ acres"""
        
        return "Please tell me your land size in acres for pump recommendation."