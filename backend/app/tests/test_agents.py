"""
Test script to verify all AI agents are working correctly
Run this after starting the FastAPI server
"""
import asyncio
import httpx
import json
from typing import Dict, Any

BASE_URL = "http://localhost:8000/api/agents"

async def test_health_check():
    """Test the health check endpoint"""
    print("\n🔍 Testing Health Check...")
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{BASE_URL}/health")
            if response.status_code == 200:
                print("✅ Health check passed")
                print(f"   Response: {json.dumps(response.json(), indent=2)}")
                return True
            else:
                print(f"❌ Health check failed: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Health check error: {str(e)}")
            return False

async def test_sentiment_agent():
    """Test the sentiment analysis agent"""
    print("\n🔍 Testing Sentiment Agent...")
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            payload = {
                "texts": [
                    "Apple stock is performing exceptionally well this quarter.",
                    "The market crash has investors worried about the future.",
                    "Tech companies are showing strong growth potential."
                ],
                "sources": ["Source1", "Source2", "Source3"]
            }
            response = await client.post(f"{BASE_URL}/sentiment", json=payload)
            if response.status_code == 200:
                data = response.json()
                print("✅ Sentiment agent test passed")
                print(f"   Aggregated sentiment: {data.get('data', {}).get('aggregated', {}).get('score', 'N/A')}")
                return True
            else:
                print(f"❌ Sentiment agent failed: {response.status_code}")
                print(f"   Error: {response.text}")
                return False
        except Exception as e:
            print(f"❌ Sentiment agent error: {str(e)}")
            return False

async def test_research_agent():
    """Test the research analysis agent"""
    print("\n🔍 Testing Research Agent...")
    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            payload = {
                "ticker": "AAPL",
                "query": "What is the current market sentiment for Apple?"
            }
            response = await client.post(f"{BASE_URL}/research", json=payload)
            if response.status_code == 200:
                data = response.json()
                print("✅ Research agent test passed")
                if data.get("success"):
                    result = data.get("data", {})
                    print(f"   Ticker: {result.get('ticker', 'N/A')}")
                    print(f"   Sentiment Score: {result.get('sentiment', {}).get('score', 'N/A')}")
                    print(f"   Summary: {result.get('summary', 'N/A')[:100]}...")
                return True
            else:
                print(f"❌ Research agent failed: {response.status_code}")
                print(f"   Error: {response.text[:200]}")
                return False
        except Exception as e:
            print(f"❌ Research agent error: {str(e)}")
            return False

async def test_research_agent_get():
    """Test the research agent GET endpoint"""
    print("\n🔍 Testing Research Agent (GET)...")
    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            response = await client.get(f"{BASE_URL}/research/AAPL?query=current%20performance")
            if response.status_code == 200:
                data = response.json()
                print("✅ Research agent GET test passed")
                return True
            else:
                print(f"❌ Research agent GET failed: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Research agent GET error: {str(e)}")
            return False

async def test_portfolio_agent():
    """Test the portfolio analysis agent"""
    print("\n🔍 Testing Portfolio Agent...")
    async with httpx.AsyncClient(timeout=90.0) as client:
        try:
            payload = {
                "tickers": ["AAPL", "MSFT", "GOOGL"],
                "watchlist_id": None
            }
            response = await client.post(f"{BASE_URL}/portfolio", json=payload)
            if response.status_code == 200:
                data = response.json()
                print("✅ Portfolio agent test passed")
                if data.get("success"):
                    result = data.get("data", {})
                    print(f"   Tickers analyzed: {len(result.get('tickers', []))}")
                    print(f"   Recommendations: {len(result.get('recommendations', []))}")
                return True
            else:
                print(f"❌ Portfolio agent failed: {response.status_code}")
                print(f"   Error: {response.text[:200]}")
                return False
        except Exception as e:
            print(f"❌ Portfolio agent error: {str(e)}")
            return False

async def test_portfolio_agent_get():
    """Test the portfolio agent GET endpoint"""
    print("\n🔍 Testing Portfolio Agent (GET)...")
    async with httpx.AsyncClient(timeout=90.0) as client:
        try:
            response = await client.get(f"{BASE_URL}/portfolio/analyze?tickers=AAPL,MSFT")
            if response.status_code == 200:
                data = response.json()
                print("✅ Portfolio agent GET test passed")
                return True
            else:
                print(f"❌ Portfolio agent GET failed: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Portfolio agent GET error: {str(e)}")
            return False

async def run_all_tests():
    """Run all agent tests"""
    print("=" * 60)
    print("🧪 AI AGENT TEST SUITE")
    print("=" * 60)
    print(f"\nTesting agents at: {BASE_URL}")
    print("Make sure the FastAPI server is running on http://localhost:8000\n")
    
    results = {}
    
    # Test health check first
    results["health"] = await test_health_check()
    
    if not results["health"]:
        print("\n⚠️  Health check failed. Make sure the server is running!")
        return
    
    # Test all agents
    results["sentiment"] = await test_sentiment_agent()
    results["research_post"] = await test_research_agent()
    results["research_get"] = await test_research_agent_get()
    results["portfolio_post"] = await test_portfolio_agent()
    results["portfolio_get"] = await test_portfolio_agent_get()
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 TEST SUMMARY")
    print("=" * 60)
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"  {status} - {test_name}")
    
    print(f"\nResults: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All agents are working correctly!")
    else:
        print(f"\n⚠️  {total - passed} test(s) failed. Check the errors above.")

if __name__ == "__main__":
    asyncio.run(run_all_tests())

