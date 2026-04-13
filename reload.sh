#!/bin/bash

ags quit &>/dev/null

sleep 0.3

ags run /home/roberto/Work/projects/ags-bar/app.tsx &
disown
