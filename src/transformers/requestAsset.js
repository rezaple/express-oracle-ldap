function transformList(data){
    return {
        ID: data.ID,
        NAMA: data.NAMA,
        ALAMAT: data.ALAMAT||"",
        PATH : (data.PATH_FILE !== undefined && data.PATH_FILE!=="" && data.PATH_FILE) ? 'http://10.60.164.5/myassist/'+data.PATH_FILE:"",
        STATUS: data.STATUS_REQUEST
    }
}

module.exports = {
    transformList,
}