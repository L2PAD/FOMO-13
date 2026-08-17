#!/usr/bin/env bash

if [ -z "$1" ]; then
    echo "Please, provide commit mesage as first parameter. Example ./commit_script.sh \"my commit message\""
fi

commitMessage=$1

npm run lint:fix
npm run lint

git add .
git commit -m "$commitMessage"
git push
