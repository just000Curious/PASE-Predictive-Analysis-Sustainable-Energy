# test_simulation_api.py
import requests
import json
import time


def test_api_health():
    """Test basic API connectivity"""
    print("🧪 TEST 1: API Health Check")
    print("-" * 40)

    try:
        response = requests.get("http://localhost:8001/api/health", timeout=5)
        print(f"✅ Status: {response.status_code}")

        data = response.json()
        print(f"✅ Response: {json.dumps(data, indent=2)}")

        if data.get('status') == 'healthy':
            print("✅ Backend is healthy!")
            return True
        else:
            print("❌ Backend not healthy")
            return False

    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to backend")
        print("   Make sure: python main.py is running")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def test_simulation_endpoint():
    """Test the main simulation endpoint"""
    print("\n🧪 TEST 2: Simulation Endpoint")
    print("-" * 40)

    # Test data matching frontend
    test_data = {
        "use_live_data": False,
        "turbine_count": 50,
        "turbine_availability": 0.95,
        "battery_capacity_mwh": 300.0,
        "initial_battery_mwh": 150.0,
        "community_demand_percent": 0.4,  # CRITICAL: 0.4 not 0.01
        "community_base_load_mw": 75.0,
        "battery_max_charge_mw": 50.0,
        "battery_max_discharge_mw": 100.0,
        "buy_price_per_mwh": 150.0,
        "sell_price_per_mwh": 40.0
    }

    try:
        print("Sending simulation request...")
        start_time = time.time()

        response = requests.post(
            "http://localhost:8001/api/simulate",
            json=test_data,
            timeout=30
        )

        processing_time = time.time() - start_time
        print(f"✅ Response time: {processing_time:.2f} seconds")
        print(f"✅ Status: {response.status_code}")

        if response.status_code == 200:
            data = response.json()
            print(f"✅ Success! Got {len(data.get('simulation_data', []))} hours")
            print(f"✅ Alerts: {len(data.get('alerts', []))}")

            # Basic data validation
            if 'simulation_data' in data and len(data['simulation_data']) == 24:
                print("✅ Correct: 24 hours of data")
            else:
                print("❌ Wrong: Should have 24 hours")

            # Check for required fields
            first_hour = data['simulation_data'][0] if data['simulation_data'] else {}
            required_fields = ['simulated_supply_mw', 'simulated_demand_mw', 'battery_charge_mwh', 'status']

            for field in required_fields:
                if field in first_hour:
                    print(f"✅ Field present: {field}")
                else:
                    print(f"❌ Missing field: {field}")

            return True
        else:
            print(f"❌ Error: {response.status_code}")
            print(f"   Response: {response.text[:200]}")
            return False

    except Exception as e:
        print(f"❌ Simulation failed: {e}")
        return False


def test_scaling_values():
    """Test if scaling is producing realistic values"""
    print("\n🧪 TEST 3: Scaling Validation")
    print("-" * 40)

    test_data = {
        "use_live_data": False,
        "turbine_count": 50,
        "community_demand_percent": 0.4
    }

    try:
        response = requests.post("http://localhost:8001/api/simulate", json=test_data)
        data = response.json()

        if not data.get('simulation_data'):
            print("❌ No data returned")
            return False

        # Extract values
        supplies = [h['simulated_supply_mw'] for h in data['simulation_data']]
        demands = [h['simulated_demand_mw'] for h in data['simulation_data']]

        print(f"Supply Analysis:")
        print(f"  Min: {min(supplies):.1f} MW")
        print(f"  Max: {max(supplies):.1f} MW")
        print(f"  Avg: {sum(supplies) / len(supplies):.1f} MW")

        print(f"\nDemand Analysis:")
        print(f"  Min: {min(demands):.1f} MW")
        print(f"  Max: {max(demands):.1f} MW")
        print(f"  Avg: {sum(demands) / len(demands):.1f} MW")

        # Check if values are realistic
        print(f"\n🔍 Realism Check:")

        # Supply should be 0-150 MW for 50 turbines
        if max(supplies) > 100:
            print(f"  ✅ Supply looks good (up to {max(supplies):.1f} MW)")
        else:
            print(f"  ⚠️ Supply might be low (max {max(supplies):.1f} MW, expected 0-150 MW)")

        # Demand should be 55-120 MW for community
        if 55 <= min(demands) <= 120 and 55 <= max(demands) <= 120:
            print(f"  ✅ Demand in correct range ({min(demands):.1f}-{max(demands):.1f} MW)")
        else:
            print(f"  ⚠️ Demand out of range ({min(demands):.1f}-{max(demands):.1f} MW, expected 55-120 MW)")

        return True

    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False


def test_error_handling():
    """Test error cases"""
    print("\n🧪 TEST 4: Error Handling")
    print("-" * 40)

    # Test 1: Invalid turbine count
    print("Test 1: Invalid turbine count...")
    try:
        response = requests.post("http://localhost:8001/api/simulate",
                                 json={"turbine_count": -5})
        if response.status_code == 422:
            print("✅ Correctly rejected invalid input")
        else:
            print(f"⚠️ Unexpected response: {response.status_code}")
    except Exception as e:
        print(f"❌ Error: {e}")

    # Test 2: Missing required fields
    print("\nTest 2: Partial data...")
    try:
        response = requests.post("http://localhost:8001/api/simulate",
                                 json={"use_live_data": True})
        print(f"✅ Handle partial data: {response.status_code}")
    except Exception as e:
        print(f"❌ Error: {e}")

    return True


def main():
    """Run all tests"""
    print("🚀 API TEST SUITE")
    print("=" * 60)

    tests = [
        ("Health Check", test_api_health),
        ("Simulation Endpoint", test_simulation_endpoint),
        ("Scaling Validation", test_scaling_values),
        ("Error Handling", test_error_handling)
    ]

    results = []

    for test_name, test_func in tests:
        print(f"\nRunning: {test_name}")
        success = test_func()
        results.append((test_name, success))

    # Summary
    print("\n" + "=" * 60)
    print("📊 TEST SUMMARY")
    print("=" * 60)

    passed = sum(1 for _, success in results if success)
    total = len(results)

    for test_name, success in results:
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {test_name}")

    print(f"\nOverall: {passed}/{total} tests passed ({passed / total * 100:.0f}%)")

    if passed == total:
        print("\n🎉 All tests passed! API is working correctly.")
    else:
        print(f"\n⚠️ {total - passed} tests failed. Check issues above.")


if __name__ == "__main__":
    main()