from django.db import models
from .config import *
from .outputs_config import *
from osgeo import gdal
from datetime import datetime
from collections import OrderedDict
import numpy as np
import pandas as pd
import os, subprocess, requests, zipfile, random, string
# from sqlalchemy.ext.declarative import declarative_base
# from sqlalchemy import Column, Integer, Float, String, ForeignKey, Date
# from sqlalchemy.orm import sessionmaker
# from sqlalchemy.sql import text
import swatApp.config as cfg
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import smtplib
import time
from os import path
from geoserver.catalog import Catalog
import psycopg2
import logging

LOG_FILENAME = "/home/tethys/subprocesses/model.log"
for handler in logging.root.handlers[:]:
    logging.root.removeHandler(handler)
logging.basicConfig(filename=LOG_FILENAME, level=logging.INFO)
# PostgreSQL db setup
# Base = declarative_base()


class accessCode(models.Model):
    access_code = models.CharField(max_length=6)

    class Meta:
        app_label = 'tethysapp.swat2'

#
# class Watershed(Base):
#     '''
#     Watershed SQLAlchemy DB Model
#     '''
#     __tablename__ = 'watershed'
#
#     # Columns
#     id = Column(Integer, primary_key=True)
#     name = Column(String)
#
#     def __init__(self, name):
#         self.name = name
#
#
# class Watershed_Info(Base):
#     '''
#     Watershed SQLAlchemy DB Model
#     '''
#     __tablename__ = 'watershed_info'
#
#     # Columns
#     id = Column(Integer, primary_key=True)
#     watershed_id = Column(Integer, ForeignKey('watershed.id'))
#     rch_start = Column(Date)
#     rch_end = Column(Date)
#     rch_vars = Column(String)
#     sub_start = Column(Date)
#     sub_end = Column(Date)
#     sub_vars = Column(String)
#     lulc = Column(String)
#     soil = Column(String)
#     stations = Column(String)
#     rch = Column(String)
#     sub = Column(String)
#     nasaaccess = Column(String)
#
#     def __init__(self, watershed_id, rch_start, rch_end, rch_vars, sub_start, sub_end, sub_vars, lulc, soil, stations,
#                  rch, sub, nasaaccess):
#         self.watershed_id = watershed_id
#         self.rch_start = rch_start
#         self.rch_end = rch_end
#         self.rch_vars = rch_vars
#         self.sub_start = sub_start
#         self.sub_end = sub_end
#         self.sub_vars = sub_vars
#         self.lulc = lulc
#         self.soil = soil
#         self.stations = stations
#         self.rch = rch
#         self.sub = sub
#         self.nasaaccess = nasaaccess
#
#
# class RCH(Base):
#     '''
#     Region SQLAlchemy DB Model
#     '''
#
#     __tablename__ = 'output_rch'
#
#     # Table Columns
#
#     id = Column(Integer, primary_key=True)
#     watershed_id = Column(Integer, ForeignKey('watershed.id'))
#     year_month_day = Column(Date)
#     reach_id = Column(Integer)
#     var_name = Column(String)
#     val = Column(Float)
#
#     def __init__(self, watershed_id, year_month_day, reach_id, var_name, val):
#         """
#         Constructor for the table
#         """
#         self.watershed_id = watershed_id
#         self.year_month_day = year_month_day
#         self.reach_id = reach_id
#         self.var_name = var_name
#         self.val = val
#
#
# class SUB(Base):
#     '''
#     Region SQLAlchemy DB Model
#     '''
#
#     __tablename__ = 'output_sub'
#
#     # Table Columns
#
#     id = Column(Integer, primary_key=True)
#     watershed_id = Column(Integer, ForeignKey('watershed.id'))
#     year_month_day = Column(Date)
#     sub_id = Column(Integer)
#     var_name = Column(String)
#     val = Column(Float)
#
#     def __init__(self, watershed_id, year_month_day, sub_id, var_name, val):
#         """
#         Constructor for the table
#         """
#         self.watershed_id = watershed_id
#         self.year_month_day = year_month_day
#         self.sub_id = sub_id
#         self.var_name = var_name
#         self.val = val
#
#
# class LULC(Base):
#     '''
#     LULC SQLAlchemy DB Model
#     '''
#
#     __tablename__ = 'lulc'
#
#     # Table Columns
#
#     id = Column(Integer, primary_key=True)
#     watershed_id = Column(Integer, ForeignKey('watershed.id'))
#     value = Column(Integer)
#     lulc = Column(String)
#     lulc_class = Column(String)
#     lulc_subclass = Column(String)
#     class_color = Column(String)
#     subclass_color = Column(String)

    # def __init__(self, watershed_id, value, lulc, lulc_class, lulc_subclass, class_color, subclass_color):
    #     """
    #     Constructor for the table
    #     """
    #     self.watershed_id = watershed_id
    #     self.value = value
    #     self.lulc = lulc
    #     self.lulc_class = lulc_class
    #     self.lulc_subclass = lulc_subclass
    #     self.class_color = class_color
    #     self.subclass_color = subclass_color

#
# class SOIL(Base):
#     '''
#     Soil SQLAlchemy DB Model
#     '''
#
#     __tablename__ = 'soil'
#
#     # Table Columns
#
#     id = Column(Integer, primary_key=True)
#     watershed_id = Column(Integer, ForeignKey('watershed.id'))
#     value = Column(Integer)
#     soil_class = Column(String)
#     class_color = Column(String)
#
#     def __init__(self, watershed_id, value, soil_class, class_color):
#         """
#         Constructor for the table
#         """
#         self.watershed_id = watershed_id
#         self.value = value
#         self.soil_class = soil_class
#         self.class_color = class_color


# class STREAM_CONNECT(Base):
#     '''
#     Stream connectivity SQLAlchemy DB Model
#     '''
#
#     __tablename__ = 'stream_connect'
#
#     # Table Columns
#
#     id = Column(Integer, primary_key=True)
#     watershed_id = Column(Integer, ForeignKey('watershed.id'))
#     stream_id = Column(Integer)
#     to_node = Column(Integer)
#
#     def __init__(self, watershed_id, stream_id, to_node):
#         """
#         Constructor for the table
#         """
#         self.watershed_id = watershed_id
#         self.stream_id = stream_id
#         self.to_node = to_node


# def init_db(engine, first_time):
#     Base.metadata.create_all(engine)
#     if first_time:
#         Session = sessionmaker(bind=engine)
#         session = Session()
#         session.commit()
#         session.close()


# Data extraction functions
def extract_daily_rch(watershed, watershed_id, start, end, parameters, reachid):
    dt_start = datetime.strptime(start, '%B %d, %Y').strftime('%Y-%m-%d')
    dt_end = datetime.strptime(end, '%B %d, %Y').strftime('%Y-%m-%d')
    daterange = pd.date_range(start, end, freq='1d')
    daterange = daterange.union([daterange[-1]])
    daterange_str = [d.strftime('%b %d, %Y') for d in daterange]
    daterange_mil = [int(d.strftime('%s')) * 1000 for d in daterange]

    rchDict = {'Watershed': watershed,
               'Dates': daterange_str,
               'ReachID': reachid,
               'Parameters': parameters,
               'Values': {},
               'Names': [],
               'Timestep': 'Daily',
               'FileType': 'rch'}

    conn = psycopg2.connect(
        "dbname={0} user={1} host={2} password={3}".format(cfg.db['name'], cfg.db['user'], cfg.db['host'],
                                                           cfg.db['pass']))
    cur = conn.cursor()
    for x in range(0, len(parameters)):
        param_name = rch_param_names[parameters[x]]
        rchDict['Names'].append(param_name)

        rch_qr = """SELECT distinct val,year_month_day FROM output_rch WHERE watershed_id={0} AND reach_id={1} AND var_name='{2}' AND year_month_day BETWEEN '{3}' AND '{4}' order by year_month_day; """.format(
            watershed_id, reachid, parameters[x], dt_start, dt_end)
        cur.execute(rch_qr)
        data = cur.fetchall()

        ts = []
        i = 0
        while i < len(data):
            ts.append([daterange_mil[i], data[i][0]])
            i += 1

        rchDict['Values'][x] = ts
        rchDict['Names'].append(param_name)
    cur.close()
    return rchDict


def extract_monthly_rch(watershed, watershed_id, start, end, parameters, reachid):
    dt_start = datetime.strptime(start, '%B %d, %Y').strftime('%Y-%m-%d')
    dt_end = datetime.strptime(end, '%B %d, %Y').strftime('%Y-%m-%d')

    daterange = pd.date_range(start, end, freq='MS')

    sss = [d.strftime('%Y-%m-%d') for d in daterange]
    daterange = daterange.union([daterange[-1]])
    daterange_str = [d.strftime('%b %d, %Y') for d in daterange]
    daterange_mil = [int(d.strftime('%s')) * 1000 for d in daterange]

    rchDict = {'Watershed': watershed,
               'Dates': daterange_str,
               'ReachID': reachid,
               'Parameters': parameters,
               'Values': {},
               'Names': [],
               'Timestep': 'Monthly',
               'FileType': 'rch'}

    conn = psycopg2.connect(
        "dbname={0} user={1} host={2} password={3}".format(cfg.db['name'], cfg.db['user'], cfg.db['host'],
                                                           cfg.db['pass']))
    cur = conn.cursor()
    for x in range(0, len(parameters)):
        param_name = rch_param_names[parameters[x]]
        rchDict['Names'].append(param_name)

        rch_qr = """SELECT distinct val,year_month_day FROM output_rch WHERE watershed_id={0} AND reach_id={1} AND var_name='{2}' AND year_month_day in {3} order by year_month_day; """.format(
            watershed_id, reachid, parameters[x], tuple(sss))
        cur.execute(rch_qr)
        data = cur.fetchall()

        ts = []
        i = 0
        while i < len(data):
            ts.append([daterange_mil[i], data[i][0]])
            i += 1
        rchDict['Values'][x] = ts
        rchDict['Names'].append(param_name)
    cur.close()
    return rchDict


def extract_sub_monthly(watershed, watershed_id, start, end, parameters, subid):
    dt_start = datetime.strptime(start, '%B %d, %Y').strftime('%Y-%m-%d')
    dt_end = datetime.strptime(end, '%B %d, %Y').strftime('%Y-%m-%d')
    daterange = pd.date_range(start, end, freq='MS')
    sss = [d.strftime('%Y-%m-%d') for d in daterange]

    daterange = daterange.union([daterange[-1]])
    daterange_str = [d.strftime('%b %d, %Y') for d in daterange]
    daterange_mil = [int(d.strftime('%s')) * 1000 for d in daterange]

    subDict = {'Watershed': watershed,
               'Dates': daterange_str,
               'ReachID': subid,
               'Parameters': parameters,
               'Values': {},
               'Names': [],
               'Timestep': 'Monthly',
               'FileType': 'sub'}

    conn = psycopg2.connect(
        "dbname={0} user={1} host={2} password={3}".format(cfg.db['name'], cfg.db['user'], cfg.db['host'],
                                                           cfg.db['pass']))
    cur = conn.cursor()

    for x in range(0, len(parameters)):
        param_name = sub_param_names[parameters[x]]
        subDict['Names'].append(param_name)

        sub_qr = """SELECT distinct val,year_month_day FROM output_sub WHERE watershed_id={0} AND sub_id={1} AND var_name='{2}' AND year_month_day in {3} order by year_month_day; """.format(
            watershed_id, subid, parameters[x], tuple(sss))
        cur.execute(sub_qr)
        data = cur.fetchall()

        ts = []
        i = 0
        while i < len(data):
            ts.append([daterange_mil[i], data[i][0]])
            i += 1

        subDict['Values'][x] = ts
        subDict['Names'].append(param_name)
    cur.close()
    return subDict


def extract_sub_daily(watershed, watershed_id, start, end, parameters, subid):
    dt_start = datetime.strptime(start, '%B %d, %Y').strftime('%Y-%m-%d')
    dt_end = datetime.strptime(end, '%B %d, %Y').strftime('%Y-%m-%d')
    daterange = pd.date_range(start, end, freq='1d')
    daterange = daterange.union([daterange[-1]])
    daterange_str = [d.strftime('%b %d, %Y') for d in daterange]
    daterange_mil = [int(d.strftime('%s')) * 1000 for d in daterange]

    subDict = {'Watershed': watershed,
               'Dates': daterange_str,
               'ReachID': subid,
               'Parameters': parameters,
               'Values': {},
               'Names': [],
               'Timestep': 'Daily',
               'FileType': 'sub'}

    conn = psycopg2.connect(
        "dbname={0} user={1} host={2} password={3}".format(cfg.db['name'], cfg.db['user'], cfg.db['host'],
                                                           cfg.db['pass']))
    cur = conn.cursor()

    for x in range(0, len(parameters)):
        param_name = sub_param_names[parameters[x]]
        subDict['Names'].append(param_name)

        sub_qr = """SELECT val,year_month_day FROM output_sub WHERE watershed_id={0} AND sub_id={1} AND var_name='{2}' AND year_month_day BETWEEN '{3}' AND '{4}' order by year_month_day; """.format(
            watershed_id, subid, parameters[x], dt_start, dt_end)
        cur.execute(sub_qr)
        data = cur.fetchall()

        ts = []
        i = 0
        while i < len(data):
            ts.append([daterange_mil[i], data[i][0]])
            i += 1

        subDict['Values'][x] = ts
        subDict['Names'].append(param_name)
    cur.close()
    return subDict


# geospatial processing functions
def get_upstreams(watershed_id, streamID):
    conn = psycopg2.connect(
        "dbname={0} user={1} host={2} password={3}".format(cfg.db['name'], cfg.db['user'], cfg.db['host'],
                                                           cfg.db['pass']))
    cur = conn.cursor()
    upstreams = [int(streamID)]
    temp_upstreams = [int(streamID)]

    while len(temp_upstreams) > 0:
        reach = temp_upstreams[0]
        upstream_qr = """SELECT stream_id FROM stream_connect WHERE watershed_id={0} AND to_node={1}""".format(
            watershed_id, reach)
        cur.execute(upstream_qr)
        records = cur.fetchall()
        for stream in records:
            if stream[0] not in upstreams:
                temp_upstreams.append(stream[0])
                upstreams.append(stream[0])
        temp_upstreams.remove(reach)
    return upstreams


def clip_raster(watershed, uniqueID, outletID, raster_type):
    logging.info("clip raster entered")
    input_json = os.path.join(temp_workspace, uniqueID, 'basin_upstream_' + outletID + '.json')
    input_tif = os.path.join(data_path, watershed, 'Land', raster_type + '.tif')
    output_tif = os.path.join(temp_workspace, uniqueID,
                              watershed + '_upstream_' + raster_type + '_' + outletID + '.tif')
    logging.info("clip raster before gdal")
    p = subprocess.Popen(
        '{0} --config GDALWARP_IGNORE_BAD_CUTLINE YES -cutline {1} -crop_to_cutline -dstalpha {2} {3}'.format(
            cfg.gdalwarp_path, input_json, input_tif, output_tif), shell=True)
    p.wait()
    logging.info("clip raster after gdal")

    storename = watershed + '_upstream_' + raster_type + '_' + outletID
    logging.info(storename)

    headers = {'Content-type': 'image/tiff', }
    user = cfg.geoserver['user']
    password = cfg.geoserver['password']
    logging.info("before reading tif")

    data = open(output_tif, 'rb').read()

    logging.info("after reading tif")

    cat = Catalog(cfg.geoserver['rest_url'], cfg.geoserver['user'], cfg.geoserver['password'])

    response = cat.get_layer(storename)
    logging.info("after reading geoserver layer")
    print(response)

    if response is None:
        request_url = '{0}workspaces/{1}/coveragestores/{2}/file.geotiff'.format(geoserver['rest_url'],
                                                                                 geoserver['workspace'], storename)
        logging.info("response success")

        requests.put(request_url, verify=False, headers=headers, data=data, auth=(user, password))
        logging.info("put into server")


def coverage_stats(watershed, watershed_id, unique_id, outletID, raster_type):
    conn = psycopg2.connect(
        "dbname={0} user={1} host={2} password={3}".format(cfg.db['name'], cfg.db['user'], cfg.db['host'],
                                                           cfg.db['pass']))
    cur = conn.cursor()
    tif_path = temp_workspace + '/' + str(unique_id) + '/' + watershed + '_upstream_' + str(raster_type) + '_' + str(
        outletID) + '.tif'
    ds = gdal.Open(tif_path)  # open user-requested TIFF file using gdal

    band = ds.GetRasterBand(1)  # read the 1st raster band
    array = np.array(band.ReadAsArray())  # create an array of all values in the raster
    size = array.size  # get the size (pixel count) of the raster
    unique, counts = np.unique(array, return_counts=True)  # find all the unique values in the raster
    unique_dict = dict(
        zip(unique, counts))  # create a dictionary containing unique values and the number of times each occurs
    # get "NoData" values from the {lulc or soil} Postgres table
    nodata_values = []
    nodata_qr = """SELECT value FROM {0} WHERE watershed_id={1} AND {0}_class='NoData'""".format(raster_type,
                                                                                                 watershed_id)
    cur.execute(nodata_qr)
    records = cur.fetchall()
    for val in records:
        nodata_values.append(val[0])

    # subtract the count of "No Data" pixels in the raster from the total raster size
    for x in unique_dict:
        if x in nodata_values:
            nodata_size = unique_dict[x]
            size = size - nodata_size
            unique_dict[x] = 0

    # compute percent coverage for each unique value
    for x in unique_dict:
        if x not in nodata_values:
            unique_dict[x] = float(unique_dict[x]) / size * 100

    # create dictionary containing all the coverage information from the raster and info.txt file
    if raster_type == 'lulc':

        # lulc is divided into classes and subclasses for easier categorizing and visualization
        lulc_dict = {'classes': {}, 'classValues': {}, 'classColors': {}, 'subclassValues': {}, 'subclassColors': {}}

        for val in unique_dict:
            if val > 0:
                lulc_qr = """SELECT * FROM {0} WHERE watershed_id={1} AND value={2}""".format(raster_type, watershed_id,
                                                                                              val)
                cur.execute(lulc_qr)
                records = cur.fetchall()
                record = records[0]
                if str(val) not in nodata_values:
                    lulc_dict['subclassColors'][record[5]] = record[7]
                    lulc_dict['subclassValues'][record[5]] = unique_dict[val]
                    lulc_dict['classes'][record[5]] = record[4]
                    if record[4] not in lulc_dict['classValues'].keys():
                        lulc_dict['classValues'][record[4]] = unique_dict[val]
                        lulc_dict['classColors'][record[4]] = record[6]
                    else:
                        # add all the % coverage values within a class together
                        lulc_dict['classValues'][record[4]] += unique_dict[val]
        return (lulc_dict)

    if raster_type == 'soil':
        # soil type is only divided into soil types and does not have subcategories like lulc
        soil_dict = {'classValues': {}, 'classColors': {}}

        for val in unique_dict:
            if val > 0:

                soil_qr = """SELECT * FROM {0} WHERE watershed_id={1} AND value={2}""".format(raster_type, watershed_id,
                                                                                              val)
                cur.execute(soil_qr)
                records = cur.fetchall()
                record = records[0]
                if str(val) not in nodata_values:
                    soil_dict['classColors'][record[3]] = record[4]
                    soil_dict['classValues'][record[3]] = unique_dict[val]
        return (soil_dict)


# nasaaccess function
def nasaaccess_run(userId, streamId, email, functions, watershed, start, end, nexgdpp):
    logging.basicConfig(filename=R_log, level=logging.INFO)

    # identify where each of the input files are located in the server
    logging.info('Running nasaaccess from SWAT Data Viewer application')
    shp_path = os.path.join(temp_workspace, userId, 'basin_upstream_' + streamId + '.json')
    dem_path = os.path.join(data_path, watershed, 'Land', 'dem' + '.tif')
    # create a new folder to store the user's requested data
    unique_id = ''.join(random.choice(string.ascii_uppercase + string.digits) for _ in range(6))
    unique_path = os.path.join(R_path, 'outputs', unique_id, 'nasaaccess_data')

    if not os.path.exists(unique_path):
        os.makedirs(unique_path)
    # create a temporary directory to store all intermediate data while nasaaccess functions run
    tempdir = os.path.join(R_temp, unique_id)

    functions = ','.join(functions)

    try:
        logging.info("trying to run nasaaccess functions")
        # pass user's inputs and file paths to the nasaaccess python function that will run detached from the app

        # run = subprocess.call([nasaaccess_py3, nasaaccess_script, email, functions, unique_id,
        #                         shp_path, dem_path, unique_path, tempdir, start, end])
        separator = ","
        nexgdpp_str = separator.join(nexgdpp)
        run = subprocess.Popen([nasaaccess_R, R_script, email, functions, unique_id,
                                shp_path, dem_path, unique_path, tempdir + '/', start, end, nexgdpp_str])

        # send_email(email, unique_id)
        return "nasaaccess is running"
    except Exception as e:
        logging.info(str(e))
        return str(e)


# data writing functions
def write_csv(data):
    watershed = data['Watershed']
    watershed = watershed.replace('_', '')

    streamID = data['ReachID']

    parameters = data['Parameters']
    param_str = '&'.join(parameters)
    param_str_low = ''.join(param_str.lower().split('_')).replace('/', '')

    timestep = data['Timestep']
    dates = data['Dates']
    values = data['Values']
    file_type = data['FileType']
    unique_id = data['userId']

    start = ''
    end = ''
    if timestep == 'Monthly':
        start = datetime.strptime(dates[0], '%b %d, %Y').strftime('%m%Y')
        end = datetime.strptime(dates[-1], '%b %d, %Y').strftime('%m%Y')
    elif timestep == 'Daily':
        start = datetime.strptime(dates[0], '%b %d, %Y').strftime('%m%d%Y')
        end = datetime.strptime(dates[-1], '%b %d, %Y').strftime('%m%d%Y')
    file_name = watershed + '_' + file_type + streamID + '_' + param_str_low + '_' + start + 'to' + end
    file_name.replace('/', '')
    file_dict = {'Parameters': param_str,
                 'Start': start,
                 'End': end,
                 'FileType': file_type,
                 'TimeStep': timestep,
                 'StreamID': streamID}
    csv_path = os.path.join(temp_workspace, unique_id, file_name + '.csv')

    fieldnames = []
    if timestep == 'Monthly':
        fieldnames = ['UTC Offset (sec)', 'Date (m/y)']
    elif timestep == 'Daily':
        fieldnames = ['UTC Offset (sec)', 'Date (m/d/y)']

    fieldnames.extend(parameters)

    utc_list = []
    date_list = []
    for i in range(0, len(dates)):
        utc_list.append(values['0'][i][0] / 1000)
        if timestep == 'Monthly':
            date_list.append(datetime.strptime(dates[i], '%b %d, %Y').strftime('%-m/%Y'))
        elif timestep == 'Daily':
            date_list.append(datetime.strptime(dates[i], '%b %d, %Y').strftime('%-m/%d/%Y'))
    d = OrderedDict()
    d[fieldnames[0]] = utc_list
    d[fieldnames[1]] = date_list

    for j in range(0, len(parameters)):
        value_list = []
        param = parameters[j]
        for i in range(0, len(dates)):
            value_list.append(values[str(j)][i][1])
        d[param] = value_list

    df = pd.DataFrame(data=d)

    df.to_csv(csv_path, sep=',', index=False)
    return file_dict


def zipfolder(zip_name, data_dir):
    zipobj = zipfile.ZipFile(zip_name + '.zip', 'w', zipfile.ZIP_DEFLATED)
    rootlen = len(data_dir) + 1
    for base, dirs, files in os.walk(data_dir):
        for file in files:
            fn = os.path.join(base, file)
            zipobj.write(fn, fn[rootlen:])
