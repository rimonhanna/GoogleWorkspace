dist() {
    npm run dist
    if [ "$?" = "1" ];
    then
        dist;
    fi
}
dist;