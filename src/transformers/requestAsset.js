const { baseUrlImageAmc } = require('../config/web-server.js');


function transformList(data){
    return {
        ID: data.ID,
        NAMA: data.NAMA,
        ALAMAT: data.ALAMAT||"",
        PATH : (data.PATH_FILE !== undefined && data.PATH_FILE!=="" && data.PATH_FILE) ? baseUrlImageAmc+data.PATH_FILE:"",
        STATUS: data.STATUS_REQUEST,
        TANGGAL: data.REQUEST_DATE||"",
        EPOCH: data.REQUEST_DATE?new Date(data.REQUEST_DATE).getTime():"",
        TYPE: (data.IDAREAL || data.IDGEDUNG)?'Edit':'Insert'
    }
}

module.exports = {
    transformList,
}