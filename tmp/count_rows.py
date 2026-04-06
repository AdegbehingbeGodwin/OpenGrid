import csv, os

files = {
    'fire_stations':   'grid3/GRID3_NGA_Fire_Stations_-8227812090643857916.csv',
    'police_stations': 'grid3/GRID3_NGA_Police_Stations_-7868985337605458759.csv',
    'post_offices':    'grid3/GRID3_NGA_Post_Offices_-4519163771452536831.csv',
    'health_facilities':'grid3/GRID3_NGA_health_facilities_v2_0_3768559736750290399.csv',
    'schools':         'grid3/Schools_in_Nigeria_4350877279695829240.csv',
    'markets':         'grid3/Markets_in_Nigeria_8237200773111699054.csv',
    'idp_sites':       'grid3/IDP_sites_in_Nigeria_1002280074927442464.csv',
    'govt_buildings':  'grid3/GRID3_NGA_Government_Buildings_5762285103048400725.csv',
    'churches':        'grid3/Churches_in_Nigeria_-1734362325775030501.csv',
    'mosques':         'grid3/Mosques_in_Nigeria_6609239168743695382.csv',
    'water_points':    'grid3/Water_points_in_Nigeria_-5822932318649382909.csv',
    'farms':           'grid3/Farms_in_Nigeria_-118746013669857057.csv',
    'factories':       'grid3/Factories_and_industrial_sites_in_Nigeria_-2376841027209567817.csv',
    'energy_substations': 'grid3/Energy_and_electricity_substations_in_Nigeria_3706089383384116443.csv',
    'filling_stations': 'grid3/filling_stations.csv',
}

for name, path in files.items():
    with open(path, encoding='utf-8', errors='replace') as f:
        count = sum(1 for _ in f) - 1  # subtract header
    size_mb = os.path.getsize(path) / 1024 / 1024
    print(f'{name:30s}: {count:>7,} rows  ({size_mb:.1f} MB)')
