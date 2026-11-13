import os
import json
import time
import base64
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

    def call_groq(self, prompt: str, system_prompt: str = "", model: str = "qwen/qwen3.8-27b", json_mode: bool = False) -> Optional[str]:
        groq_key = os.getenv("GROQ_API_KEY") or GROQ_API_KEY
        if not groq_key:
            return None
        candidate_models = [model, "qwen/qwen3.8-27b", "openai/gpt-oss-20b", "allam-2-7b"]
        candidate_models = list(dict.fromkeys(candidate_models))
        for m in candidate_models:
            try:
                url = "https://api.groq.com/openai/v1/chat/completions"
                headers = {
                    "Authorization": f"Bearer {groq_key}",
                    "Content-Type": "application/json"
                }
                messages = []
                if system_prompt:
                    messages.append({"role": "system", "content": system_prompt})
                messages.append({"role": "user", "content": prompt})

                payload = {
                    "model": m,
                    "messages": messages,
                    "temperature": 0.2,
                    "max_tokens": 2048,
                }
                if json_mode:
                    payload["response_format"] = {"type": "json_object"}

                resp = requests.post(url, headers=headers, json=payload, timeout=8)
                if resp.status_code == 200:
                    data = resp.json()
                    return data["choices"][0]["message"]["content"]
                else:
                    print(f"[AI Provider] Groq model {m} returned {resp.status_code}")
            except Exception as e:
                print(f"[AI Provider] Groq exception on {m}: {e}")
        return None

    def call_huggingface_gemma(self, prompt: str, system_prompt: str = "") -> Optional[str]:
        """Call Hugging Face Gemma / Open models using user HF_TOKEN."""
        hf_token = os.getenv("HF_TOKEN") or os.getenv("HUGGINGFACE_API_KEY") or HF_TOKEN
        if not hf_token:
            return None
        gemma_models = [
            "google/gemma-2-2b-it",
            "google/gemma-2-9b-it",
            "google/gemma-7b-it"
        ]
        headers = {
            "Authorization": f"Bearer {hf_token}",
            "Content-Type": "application/json"
        }
        for g_model in gemma_models:
            try:
                url = f"https://router.huggingface.co/hf-inference/models/{g_model}"
                full_input = f"{system_prompt}\n\nUser: {prompt}\nAssistant:" if system_prompt else prompt
                payload = {
                    "inputs": full_input,
                    "parameters": {"max_new_tokens": 512, "temperature": 0.2, "return_full_text": False}
                }
                resp = requests.post(url, headers=headers, json=payload, timeout=6)
                if resp.status_code == 200:
                    data = resp.json()
                    if isinstance(data, list) and len(data) > 0:
                        gen = data[0].get("generated_text", "")
                        if gen:
                            return gen.strip()
            except Exception as e:
                print(f"[AI Provider] HF Gemma exception ({g_model}): {e}")
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
        Orchestrate LLM call across Hugging Face Gemma, Groq, Gemini, and OpenAI.
        """
        start_time = time.time()
        result_text = None
        used_provider = "none"

        # Check for user query mentioning gemma / huggingface
        prompt_lower = prompt.lower()
        if "gemma" in prompt_lower or "hugging" in prompt_lower or os.getenv("PREFER_GEMMA") == "1":
            result_text = self.call_huggingface_gemma(prompt, system_prompt)
            if result_text:
                used_provider = "huggingface-gemma"

        # Primary high-speed provider: Groq
        if not result_text and (os.getenv("GROQ_API_KEY") or GROQ_API_KEY):
            result_text = self.call_groq(prompt, system_prompt, json_mode=json_mode)
            if result_text:
                used_provider = "groq-qwen"

        # Fallback to Hugging Face Gemma if not tried yet
        if not result_text and (os.getenv("HF_TOKEN") or HF_TOKEN):
            result_text = self.call_huggingface_gemma(prompt, system_prompt)
            if result_text:
                used_provider = "huggingface-gemma"

        # Fallback to Google Gemini
        if not result_text and (os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")):
            result_text = self.call_gemini(prompt, system_prompt)
            if result_text:
                used_provider = "gemini"

        # Fallback to Anthropic Claude or OpenAI
        if not result_text and ANTHROPIC_API_KEY:
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
