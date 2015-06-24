hostip=`netstat -rn | grep '^0.0.0.0' | awk '{print $2}'`
cat <<EOF
{
    "host": "${hostip}",
    "database": "year3_graphs",
    "collection": "mentions_monica_nino_2hop_mar12"
}
EOF
