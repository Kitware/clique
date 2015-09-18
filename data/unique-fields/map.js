function () {
    var key;

    if (this.data) {
        for (key in this.data) {
            if (this.data.hasOwnProperty(key)) {
                emit(key, 1);
            }
        }
    }
}
