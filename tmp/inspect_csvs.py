import csv

files = {
    'fire_stations': 'grid3/GRID3_NGA_Fire_Stations_-8227812090643857916.csv',
    'police': 'grid3/GRID3_NGA_Police_Stations_-7868985337605458759.csv',
    'post_offices': 'grid3/GRID3_NGA_Post_Offices_-4519163771452536831.csv',
    'health': 'grid3/GRID3_NGA_health_facilities_v2_0_3768559736750290399.csv',
    'schools': 'grid3/Schools_in_Nigeria_4350877279695829240.csv',
    'markets': 'grid3/Markets_in_Nigeria_8237200773111699054.csv',
    'idp': 'grid3/IDP_sites_in_Nigeria_1002280074927442464.csv',
    'govt_buildings': 'grid3/GRID3_NGA_Government_Buildings_5762285103048400725.csv',
}

for name, path in files.items():
    with open(path, encoding='utf-8', errors='replace') as f:
        reader = csv.DictReader(f)
        headers = reader.fieldnames
        row1 = next(reader, {})
    print(f'=== {name} ({len(headers)} cols) ===')
    for h in headers:
        val = str(row1.get(h, ''))[:60]
        print(f'  {h}: {val}')
    print()
