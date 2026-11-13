import os
import json
import time
import requests
from typing import Dict, Any, List, Optional
from dotenv import load_dotenv

env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
if os.path.exists(env_path):
    load_dotenv(dotenv_path=env_path)

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
HF_TOKEN = os.getenv("HF_TOKEN") or os.getenv("HUGGINGFACE_API_KEY", "")
JEV_API_KEY = os.getenv("JEV_API_KEY", "")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY", "")

class AIProviderOrchestrator:
    def __init__(self):
        self.default_fast_provider = "groq"
        self.default_reasoning_provider = "anthropic"
        self.fallback_provider = "openai"

    def get_provider_status(self) -> Dict[str, Any]:
        return {
            "groq": bool(GROQ_API_KEY),
            "anthropic": bool(ANTHROPIC_API_KEY),
            "openai": bool(OPENAI_API_KEY),
            "huggingface": bool(HF_TOKEN),
            "jev": bool(JEV_API_KEY),
            "fast_provider": self.default_fast_provider,
            "reasoning_provider": self.default_reasoning_provider,
            "fallback_provider": self.fallback_provider,
        }

    def call_jev_decide(self, state: str, choices: Optional[List[str]] = None) -> Optional[Dict[str, Any]]:
        """Call Jev structured decision API for fast diagnostic & agent guidance."""
        jev_key = os.getenv("JEV_API_KEY") or JEV_API_KEY
        if not jev_key:
            return None
        endpoints = [
            "https://jevtypesafe.org/api/v1/decide",
            "https://jevtypesafeai.com/api/v1/decide"
        ]
        headers = {
            "Authorization": f"Bearer {jev_key}",
            "Content-Type": "application/json"
        }
        payload: Dict[str, Any] = {"state": state}
        if choices:
            payload["choices"] = choices

        for ep in endpoints:
            try:
                resp = requests.post(ep, headers=headers, json=payload, timeout=5)
                if resp.status_code == 200:
                    return resp.json()
            except Exception as e:
                print(f"[AI Provider] Jev exception ({ep}): {e}")
        return None

    def call_groq(self, prompt: str, system_prompt: str = "", model: str = "llama-3.1-8b-instant", json_mode: bool = False) -> Optional[str]:
        if not GROQ_API_KEY:
            return None
        try:
            url = "https://api.groq.com/openai/v1/chat/completions"
            headers = {
                "Authorization": f"Bearer {GROQ_API_KEY}",
                "Content-Type": "application/json"
            }
            messages = []
            if system_prompt:
                messages.append({"role": "system", "content": system_prompt})
            messages.append({"role": "user", "content": prompt})

            payload = {
                "model": model,
                "messages": messages,
                "temperature": 0.2,
                "max_tokens": 2048,
            }
            if json_mode:
                payload["response_format"] = {"type": "json_object"}

            resp = requests.post(url, headers=headers, json=payload, timeout=3)
            if resp.status_code == 200:
                data = resp.json()
                return data["choices"][0]["message"]["content"]
            else:
                print(f"[AI Provider] Groq error {resp.status_code}: {resp.text}")
                return None
        except Exception as e:
            print(f"[AI Provider] Groq exception: {e}")
            return None

    def call_anthropic(self, prompt: str, system_prompt: str = "", model: str = "claude-3-5-sonnet-20241022") -> Optional[str]:
        if not ANTHROPIC_API_KEY:
            return None
        try:
            url = "https://api.anthropic.com/v1/messages"
            headers = {
                "x-api-key": ANTHROPIC_API_KEY,
                "anthropic-version": "2023-06-01",
                "Content-Type": "application/json"
            }
            payload = {
                "model": model,
                "max_tokens": 2500,
                "temperature": 0.2,
                "messages": [{"role": "user", "content": prompt}]
            }
            if system_prompt:
                payload["system"] = system_prompt

            resp = requests.post(url, headers=headers, json=payload, timeout=25)
            if resp.status_code == 200:
                data = resp.json()
                return data["content"][0]["text"]
            else:
                print(f"[AI Provider] Anthropic error {resp.status_code}: {resp.text}")
                return None
        except Exception as e:
            print(f"[AI Provider] Anthropic exception: {e}")
            return None

    def call_openai(self, prompt: str, system_prompt: str = "", model: str = "gpt-4o-mini", json_mode: bool = False) -> Optional[str]:
        if not OPENAI_API_KEY:
            return None
        try:
            url = "https://api.openai.com/v1/chat/completions"
            headers = {
                "Authorization": f"Bearer {OPENAI_API_KEY}",
                "Content-Type": "application/json"
            }
            messages = []
            if system_prompt:
                messages.append({"role": "system", "content": system_prompt})
            messages.append({"role": "user", "content": prompt})

            payload = {
                "model": model,
                "messages": messages,
                "temperature": 0.2,
                "max_tokens": 2048
            }
            if json_mode:
                payload["response_format"] = {"type": "json_object"}

            resp = requests.post(url, headers=headers, json=payload, timeout=3)
            if resp.status_code == 200:
                data = resp.json()
                return data["choices"][0]["message"]["content"]
            else:
                print(f"[AI Provider] OpenAI error {resp.status_code}: {resp.text}")
                return None
        except Exception as e:
            print(f"[AI Provider] OpenAI exception: {e}")
            return None

    def generate_embedding_hf(self, text: str) -> Optional[List[float]]:
        """Generate embedding vector using Hugging Face inference API or fallback."""
        if not HF_TOKEN:
            return None
        try:
            model = "sentence-transformers/all-MiniLM-L6-v2"
            url = f"https://api-inference.huggingface.co/pipeline/feature-extraction/{model}"
            headers = {"Authorization": f"Bearer {HF_TOKEN}"}
            resp = requests.post(url, headers=headers, json={"inputs": text}, timeout=15)
            if resp.status_code == 200:
                emb = resp.json()
                if isinstance(emb, list) and isinstance(emb[0], (int, float)):
                    return emb
                elif isinstance(emb, list) and isinstance(emb[0], list):
                    return emb[0]
            return None
        except Exception as e:
            print(f"[AI Provider] HF embedding error: {e}")
            return None

    def call_gemini(self, prompt: str, system_prompt: str = "", model: str = "gemini-1.5-flash") -> Optional[str]:
        gemini_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY", "")
        if not gemini_key:
            return None
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={gemini_key}"
            headers = {"Content-Type": "application/json"}
            full_prompt = f"System Instructions:\n{system_prompt}\n\nUser Prompt:\n{prompt}" if system_prompt else prompt
            payload = {
                "contents": [{"parts": [{"text": full_prompt}]}],
                "generationConfig": {
                    "temperature": 0.2,
                    "maxOutputTokens": 2048
                }
            }
            resp = requests.post(url, headers=headers, json=payload, timeout=3)
            if resp.status_code == 200:
                data = resp.json()
                return data["candidates"][0]["content"]["parts"][0]["text"]
            else:
                print(f"[AI Provider] Gemini error {resp.status_code}: {resp.text}")
                return None
        except Exception as e:
            print(f"[AI Provider] Gemini exception: {e}")
            return None

    def generate_completion(self, prompt: str, system_prompt: str = "", task_type: str = "fast", json_mode: bool = False) -> Dict[str, Any]:
        """
        Orchestrate LLM call based on task type and live availability:
        For fast tasks (Shubh AI Tutor, instant response), prioritizes Groq llama-3.1-8b-instant for sub-second latency.
        Falls back to Gemini, Claude, and OpenAI resiliently.
        """
        start_time = time.time()
        result_text = None
        used_provider = "none"

        # For fast tasks, Groq's llama-3.1-8b-instant yields the fastest sub-500ms time to first token
        if task_type == "fast" and GROQ_API_KEY:
            result_text = self.call_groq(prompt, system_prompt, model="llama-3.1-8b-instant", json_mode=json_mode)
            if result_text:
                used_provider = "groq-fast"

        # Try Google Gemini (AI Studio) next if not yet resolved
        if not result_text and (os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")):
            result_text = self.call_gemini(prompt, system_prompt)
            if result_text:
                used_provider = "gemini"

        # Try slower providers only for non-fast reasoning tasks
        if not result_text and task_type != "fast":
            if ANTHROPIC_API_KEY:
                result_text = self.call_anthropic(prompt, system_prompt)
                if result_text:
                    used_provider = "anthropic"

            if not result_text and OPENAI_API_KEY:
                result_text = self.call_openai(prompt, system_prompt, json_mode=json_mode)
                if result_text:
                    used_provider = "openai"

        elapsed = round(time.time() - start_time, 2)
        return {
            "content": result_text,
            "provider": used_provider,
            "latency_seconds": elapsed,
            "success": result_text is not None
        }

ai_orchestrator = AIProviderOrchestrator()
