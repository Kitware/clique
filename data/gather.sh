#!bin/sh

datapath="$1"
if [ -z $datapath ]; then
    exit 1
fi

for file in $datapath/*_nodes.csv; do
    basename=`echo "$file" | cut -d _ -f 1`
    node="${basename}_nodes.csv"
    link="${basename}_links.csv"

    python2 csv2json.py "${node}" "${link}"
done
