#!/bin/bash

read -p "Enter your commit message: " message
git add .
git commit -m "$message"
