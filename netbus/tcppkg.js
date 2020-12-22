let tcppkg = {
    /** 获取长度 */
    red_pkg_size:function (data, offset) {
        if (offset > data.length - 2) {
            return -1;
        }
        let len = data.readUInt16LE(offset);
        return len;
    },
    /** 封包 */
    package_data: function (data) {
        let buf = Buffer.allocUnsafe(2 + data.length);
        buf.writeInt16LE(2 + data.length, 0);
        buf.fill(data, 2);
        return buf;
    }
}
module.exports = tcppkg;