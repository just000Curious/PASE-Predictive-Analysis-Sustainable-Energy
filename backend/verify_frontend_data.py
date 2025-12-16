# verify_frontend_data.py
import requests
import numpy as np
import json
import pandas as pd
from datetime import datetime


def verify_frontend_connection():
    """Verify frontend can connect to backend"""
    print("🔗 Verifying Frontend-Backend Connection")
    print("-" * 40)

    # Simulate frontend request
    frontend_request = {
        "use_live_data": False,
        "turbine_count": 50,
        "turbine_availability": 0.95,
        "battery_capacity_mwh": 300.0,
        "initial_battery_mwh": 150.0,
        "community_demand_percent": 0.4,  # MUST BE 0.4
        "community_base_load_mw": 75.0,
        "battery_max_charge_mw": 50.0,
        "battery_max_discharge_mw": 100.0,
        "buy_price_per_mwh": 150.0,
        "sell_price_per_mwh": 40.0
    }

    try:
        print("Sending frontend-like request...")
        response = requests.post(
            "http://localhost:8001/api/simulate",
            json=frontend_request,
            timeout=10
        )

        if response.status_code == 200:
            print("✅ Connection successful!")
            return response.json()
        else:
            print(f"❌ API error: {response.status_code}")
            print(f"   Response: {response.text[:200]}")
            return None

    except Exception as e:
        print(f"❌ Connection failed: {e}")
        return None


def verify_data_quality(data):
    """Verify data meets frontend requirements"""
    print("\n📊 Verifying Data Quality")
    print("-" * 40)

    if not data or 'simulation_data' not in data:
        print("❌ No data received")
        return False

    hours = data['simulation_data']
    print(f"✅ Received {len(hours)} hours of data")

    # Check all hours have required fields
    required_fields = ['hour', 'simulated_supply_mw', 'simulated_demand_mw',
                       'battery_charge_mwh', 'status', 'net_balance_mw',
                       'to_grid_mw', 'from_grid_mw', 'battery_percent']

    missing_fields = []
    for field in required_fields:
        if field not in hours[0]:
            missing_fields.append(field)

    if missing_fields:
        print(f"❌ Missing fields: {missing_fields}")
        return False
    else:
        print("✅ All required fields present")

    # Check data types
    print("\nChecking data types...")
    type_checks = []
    for i, hour in enumerate(hours[:3]):  # Check first 3 hours
        for field in required_fields:
            if field in hour:
                if field in ['hour', 'status']:
                    # Should be int or str
                    if not isinstance(hour[field], (int, str)):
                        print(f"   ❌ {field} has wrong type: {type(hour[field])}")
                        type_checks.append(False)
                else:
                    # Should be numeric
                    if not isinstance(hour[field], (int, float)):
                        print(f"   ❌ {field} has wrong type: {type(hour[field])}")
                        type_checks.append(False)

    if all(type_checks) or not type_checks:
        print("✅ All data types are correct")
    else:
        print("❌ Some data types are incorrect")
        return False

    return True


def verify_realistic_ranges(data):
    """Verify data is in realistic ranges"""
    print("\n🎯 Verifying Realistic Ranges")
    print("-" * 40)

    hours = data['simulation_data']

    # Extract data
    supplies = [h['simulated_supply_mw'] for h in hours]
    demands = [h['simulated_demand_mw'] for h in hours]
    batteries = [h['battery_charge_mwh'] for h in hours]
    battery_percents = [h['battery_percent'] for h in hours]
    net_balances = [h['net_balance_mw'] for h in hours]

    checks = []

    # 1. Supply: 0-150 MW for 50 turbines
    print("1. Wind Supply (50 × 3MW turbines):")
    print(f"   Range: {min(supplies):.1f} - {max(supplies):.1f} MW")
    print(f"   Average: {np.mean(supplies):.1f} MW")
    if 0 <= min(supplies) <= 150 and 0 <= max(supplies) <= 150:
        print("   ✅ Within 0-150 MW range")
        checks.append(True)
    else:
        print(f"   ❌ Outside expected range")
        checks.append(False)

    # 2. Demand: 55-120 MW for community
    print("\n2. Community Demand:")
    print(f"   Range: {min(demands):.1f} - {max(demands):.1f} MW")
    print(f"   Average: {np.mean(demands):.1f} MW")
    if 55 <= min(demands) <= 120 and 55 <= max(demands) <= 120:
        print("   ✅ Within 55-120 MW range")
        checks.append(True)
    else:
        print(f"   ❌ Outside expected range")
        checks.append(False)

    # 3. Battery: 30-270 MWh (10-90% of 300MWh)
    print("\n3. Battery State (300 MWh capacity):")
    print(f"   Range: {min(batteries):.1f} - {max(batteries):.1f} MWh")
    soc_min = min(batteries) / 300
    soc_max = max(batteries) / 300
    print(f"   SOC Range: {soc_min:.1%} - {soc_max:.1%}")
    print(f"   Battery % Range: {min(battery_percents):.1f}% - {max(battery_percents):.1f}%")

    if 0.1 <= soc_min <= 0.9 and 0.1 <= soc_max <= 0.9:
        print("   ✅ Within 10-90% SOC (battery healthy)")
        checks.append(True)
    else:
        print("   ❌ Outside healthy SOC range")
        checks.append(False)

    # 4. Data variation
    print("\n4. Data Variation:")
    unique_demands = len(set(round(d, 1) for d in demands))
    unique_supplies = len(set(round(s, 1) for s in supplies))
    print(f"   Unique demand values: {unique_demands}/24")
    print(f"   Unique supply values: {unique_supplies}/24")

    if unique_demands > 1 and unique_supplies > 1:
        print("   ✅ Data has realistic variation")
        checks.append(True)
    else:
        print("   ❌ Data lacks variation (all values same)")
        checks.append(False)

    # 5. Net balance logic
    print("\n5. Net Balance Logic:")
    print(f"   Net balance range: {min(net_balances):.1f} - {max(net_balances):.1f} MW")

    # Check if status matches net balance
    status_errors = 0
    for h in hours:
        net = h['net_balance_mw']
        status = h['status']

        if status == 'Surplus' and net <= 2:
            status_errors += 1
        elif status == 'Deficit' and net >= -2:
            status_errors += 1
        elif status == 'Balanced' and (net < -2 or net > 2):
            status_errors += 1

    if status_errors == 0:
        print("   ✅ Status correctly matches net balance")
        checks.append(True)
    else:
        print(f"   ❌ {status_errors} status mismatches found")
        checks.append(False)

    return all(checks)


def verify_summary_data(data):
    """Verify summary statistics are correct"""
    print("\n📈 Verifying Summary Data")
    print("-" * 40)

    if 'summary' not in data:
        print("❌ No summary data found")
        return False

    summary = data['summary']
    checks = []

    # Check required summary sections
    required_sections = ['operational', 'battery', 'grid', 'alerts']
    for section in required_sections:
        if section in summary:
            print(f"✅ {section.capitalize()} section present")
        else:
            print(f"❌ Missing {section} section")
            checks.append(False)

    # Check key metrics
    if 'operational' in summary:
        ops = summary['operational']
        print("\nKey Operational Metrics:")

        # Self-sufficiency should be 0-100%
        if 'self_sufficiency' in summary.get('grid', {}):
            ss = summary['grid']['self_sufficiency']
            print(f"   Self-sufficiency: {ss}%")
            if 0 <= ss <= 100:
                print("   ✅ Valid self-sufficiency percentage")
                checks.append(True)
            else:
                print("   ❌ Invalid self-sufficiency")
                checks.append(False)

        # Total generation should be positive
        if 'total_generation_mwh' in ops:
            gen = ops['total_generation_mwh']
            print(f"   Total generation: {gen} MWh")
            if gen >= 0:
                print("   ✅ Valid generation amount")
                checks.append(True)
            else:
                print("   ❌ Negative generation")
                checks.append(False)

    # Check maintenance windows
    if 'maintenance_windows' in data:
        windows = data['maintenance_windows']
        print(f"\nMaintenance Windows: {len(windows)} found")
        for i, window in enumerate(windows[:2]):  # Show first 2
            print(f"   Window {i + 1}: Score={window.get('score', 0):.2f}")

    return all(checks) if checks else True


def verify_alerts(data):
    """Verify alerts are generated correctly"""
    print("\n⚠️ Verifying Alerts System")
    print("-" * 40)

    if 'alerts' not in data:
        print("❌ No alerts data found")
        return False

    alerts = data['alerts']
    print(f"Total alerts generated: {len(alerts)}")

    if len(alerts) > 0:
        print("\nSample alerts:")
        for i, alert in enumerate(alerts[:3]):  # Show first 3 alerts
            print(f"   {i + 1}. [{alert.get('level', 'N/A')}] {alert.get('message', 'No message')}")

    # Check alert structure
    valid_alerts = True
    for alert in alerts:
        if 'level' not in alert or 'message' not in alert:
            valid_alerts = False
            print("❌ Alert missing required fields")
            break

    if valid_alerts:
        print("✅ Alerts structure is valid")

    return valid_alerts


def generate_test_report(data):
    """Generate a comprehensive test report"""
    print("\n" + "=" * 60)
    print("📋 COMPREHENSIVE TEST REPORT")
    print("=" * 60)

    if not data:
        print("❌ No data to analyze")
        return

    # Create DataFrame for analysis
    df = pd.DataFrame(data['simulation_data'])

    print("\n📅 Simulation Period:")
    print(f"   Start: {df['datetime'].min()}")
    print(f"   End: {df['datetime'].max()}")
    print(f"   Duration: {len(df)} hours")

    print("\n⚡ Power Statistics:")
    print(f"   Total Generation: {df['simulated_supply_mw'].sum():.1f} MWh")
    print(f"   Total Consumption: {df['simulated_demand_mw'].sum():.1f} MWh")
    print(f"   Net Energy: {df['net_balance_mw'].sum():.1f} MWh")

    print("\n🔋 Battery Performance:")
    print(f"   Initial SOC: {df.iloc[0]['battery_percent']:.1f}%")
    print(f"   Final SOC: {df.iloc[-1]['battery_percent']:.1f}%")
    print(f"   Max SOC: {df['battery_percent'].max():.1f}%")
    print(f"   Min SOC: {df['battery_percent'].min():.1f}%")

    print("\n💰 Grid Interaction:")
    total_export = df['to_grid_mw'].sum()
    total_import = df['from_grid_mw'].sum()
    print(f"   Total Export: {total_export:.1f} MWh")
    print(f"   Total Import: {total_import:.1f} MWh")
    print(f"   Net Export: {total_export - total_import:.1f} MWh")

    print("\n📊 Status Distribution:")
    status_counts = df['status'].value_counts()
    for status, count in status_counts.items():
        percentage = (count / len(df)) * 100
        print(f"   {status}: {count}h ({percentage:.1f}%)")

    print("\n🌬️ Wind Conditions:")
    print(f"   Average Wind Speed: {df['wind_speed'].mean():.1f} m/s")
    print(f"   Max Wind Speed: {df['wind_speed'].max():.1f} m/s")
    print(f"   Min Wind Speed: {df['wind_speed'].min():.1f} m/s")

    # Check for issues
    print("\n🔍 Potential Issues:")
    issues = []

    # Constant demand check
    if df['simulated_demand_mw'].nunique() < 5:
        issues.append("Demand lacks variation")

    # Battery outside healthy range
    if df['battery_percent'].min() < 10 or df['battery_percent'].max() > 90:
        issues.append("Battery outside healthy SOC range")

    # No alerts generated
    if len(data.get('alerts', [])) == 0:
        issues.append("No alerts generated")

    if issues:
        for issue in issues:
            print(f"   ⚠️ {issue}")
    else:
        print("   ✅ No major issues detected")

    print("\n" + "=" * 60)
    print("✅ TEST COMPLETE")
    print("=" * 60)


def run_complete_verification():
    """Run all verification steps"""
    print("🧪 Starting Complete Frontend Data Verification")
    print("=" * 60)

    # Step 1: Test connection
    data = verify_frontend_connection()
    if not data:
        print("\n❌ Verification failed at connection step")
        return False

    # Step 2: Verify data quality
    if not verify_data_quality(data):
        print("\n❌ Verification failed at data quality step")
        return False

    # Step 3: Verify realistic ranges
    if not verify_realistic_ranges(data):
        print("\n❌ Verification failed at range check step")
        return False

    # Step 4: Verify summary data
    if not verify_summary_data(data):
        print("\n❌ Verification failed at summary check step")
        return False

    # Step 5: Verify alerts
    if not verify_alerts(data):
        print("\n⚠️ Alerts verification had issues")

    # Step 6: Generate comprehensive report
    generate_test_report(data)

    return True


if __name__ == "__main__":
    # Run the verification
    success = run_complete_verification()

    if success:
        print("\n🎉 All verifications passed! Frontend data is ready.")
        print("✅ Connection: Working")
        print("✅ Data Quality: Good")
        print("✅ Realistic Ranges: Valid")
        print("✅ Summary Data: Complete")
        print("\n🚀 Ready for frontend integration!")
    else:
        print("\n❌ Verification failed. Check the issues above.")
        print("💡 Suggestion: Run the simulation service first:")
        print("   python -m uvicorn app:app --port 8001 --reload")
        exit(1)