hostip=`netstat -rn | grep '^0.0.0.0' | awk '{print $2}'`
cat <<EOF
{
    "xdataHost": "${hostip}",
    "xdataDatabase": "year3_graphs",
    "xdataCollection": "mentions_monica_nino_2hop_mar12",

    "mongoHost": "${hostip}",
    "mongoDatabase": "year3_graphs",
    "mongoCollection": "twittermentions"
}
EOF
