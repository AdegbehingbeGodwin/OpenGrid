import csv

files = {
    'churches': 'grid3/Churches_in_Nigeria_-1734362325775030501.csv',
    'mosques': 'grid3/Mosques_in_Nigeria_6609239168743695382.csv',
    'water_points': 'grid3/Water_points_in_Nigeria_-5822932318649382909.csv',
    'farms': 'grid3/Farms_in_Nigeria_-118746013669857057.csv',
    'factories': 'grid3/Factories_and_industrial_sites_in_Nigeria_-2376841027209567817.csv',
    'energy_substations': 'grid3/Energy_and_electricity_substations_in_Nigeria_3706089383384116443.csv',
    'filling_stations': 'grid3/filling_stations.csv',
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
