from django.contrib import admin
from django.urls import path
from swatApp import views, ajax_controllers
from swatApp import api

app_name = 'rheasApp'

urlpatterns = [
    path('', views.home, name=''),
    path('home/', views.home, name='home'),
    path('home/download_files', ajax_controllers.download_files, name='download_files'),
    path('ws_options',views.ws_options,name='ws_options'),
    path('apps/swat2/update_selectors/',ajax_controllers.update_selectors,name="update_selectors"),
    path('apps/swat2/get_upstream/',ajax_controllers.get_upstream,name="get_upstream"),
    path('apps/swat2/save_json/',ajax_controllers.save_json,name="save_json"),
    path('apps/swat2/update_selectors/',ajax_controllers.update_selectors,name="update_selectors"),
    path('apps/swat2/timeseries/', ajax_controllers.timeseries, name="timeseries"),
    path('apps/swat2/clip_rasters/', ajax_controllers.clip_rasters, name="clip_rasters"),
    path('apps/swat2/run_nasaaccess/', ajax_controllers.run_nasaaccess, name="run_nasaaccess"),
    path('apps/swat2/coverage_compute/', ajax_controllers.coverage_compute, name="coverage_compute"),
    path('apps/swat2/coverage_stats/', ajax_controllers.coverage_stats, name="coverage_stats"),
    path('apps/swat2/save_file/', ajax_controllers.save_file, name="save_file"),
    path('apps/swat2/save_file_lulc/', ajax_controllers.save_file_lulc, name="save_file_lulc"),
    path('apps/swat2/save_file_soil/', ajax_controllers.save_file_soil, name="save_file_soil"),

    ]