function transformList(data){
    return {
        IDGEDUNG: parseInt(data.IDGEDUNG,10),
        IDAREAL: parseInt(data.IDAREAL,10),
        COOR_X: data.COOR_X?data.COOR_X:0,
        COOR_Y: data.COOR_Y?data.COOR_Y:0,
        NAMA_GEDUNG: data.NAMA_GEDUNG,
        ALAMAT: data.ALAMAT?data.ALAMAT:"",
        LUAS_BANGUNAN: data.LUAS_BANGUNAN?parseInt(data.LUAS_BANGUNAN,10):0,
        JUMLAH_LANTAI: data.JUMLAH_LANTAI?parseInt(data.JUMLAH_LANTAI,10):0,
        SALEABLE_AREA: data.SALEABLE_AREA?parseInt(data.SALEABLE_AREA,10):0,
        NAMA_KEGIATAN: data.NAMA_KEGIATAN?data.NAMA_KEGIATAN:"",
        PATH_GEDUNG_IMAGE: data.PATH_GEDUNG_IMAGE?'http://mrra.telkom.co.id/gis/assets'+data.PATH_GEDUNG_IMAGE:"",
        RN: data.RN,
        DISTANCE: data.DISTANCE? parseFloat(data.DISTANCE.toFixed(2)):0
    }
}

function transformGedungMaster(data){
    return {
        IDGEDUNG: parseInt(data.IDGEDUNG,10),
        IDAREAL: parseInt(data.IDAREAL,10),
        COOR_X: data.COOR_X?data.COOR_X:0,
        COOR_Y: data.COOR_Y?data.COOR_Y:0,
        NAMA_GEDUNG: data.NAMA_GEDUNG,
        ALAMAT: data.ALAMAT?data.ALAMAT:"",
        DESA: data.DESA?data.DESA:"",
        KECAMATAN: data.KECAMATAN?data.KECAMATAN:"",
        KOTA: data.KOTA?data.KOTA:"",
        PROPINSI: data.PROPINSI?data.PROPINSI:"",
        TREG: data.TREG?data.TREG:"",
        WITEL: data.WITEL?data.WITEL:"",
        UNIT_GSD: data.UNIT_GSD?data.UNIT_GSD:"",
        LUAS_BANGUNAN: data.LUAS_BANGUNAN?parseInt(data.LUAS_BANGUNAN,10):0,
        JUMLAH_LANTAI: data.JUMLAH_LANTAI?parseInt(data.JUMLAH_LANTAI,10):0,
        SALEABLE_AREA: data.SALEABLE_AREA?parseInt(data.SALEABLE_AREA,10):0,
        OCCUPACY_RATE: data.OCCUPACY_RATE?parseInt(data.OCCUPACY_RATE,10):0,
        PATH_GEDUNG_IMAGE: data.PATH_GEDUNG_IMAGE?'http://mrra.telkom.co.id/gis/assets'+data.PATH_GEDUNG_IMAGE:""
    };
}

function transformLahan(data){
    return {
        IDAREAL: parseInt(data.IDAREAL),
        COOR_X: data.COOR_X,
        COOR_Y: data.COOR_Y,
        NAMA_LAHAN: data.NAMA_LAHAN,
        ALAMAT: data.ALAMAT,
        LUAS_LAHAN: data.LUAS_LAHAN?data.LUAS_LAHAN:0,
        JUMLAH_BANGUNAN: data.JUMLAH_BANGUNAN?data.JUMLAH_BANGUNAN:0,
        GUNA_LAHAN: data.GUNA_LAHAN?data.GUNA_LAHAN:"",
        SKHAK: data.SKHAK?data.SKHAK:"",
        TANGGAL_AKHIR: data.TANGGAL_AKHIR?data.TANGGAL_AKHIR:"",
        NAMA_KLASIFIKASI: data.NAMA_KLASIFIKASI?data.NAMA_KLASIFIKASI:"",
        STATUS_KEP: data.STATUS_KEP?data.STATUS_KEP:"",
        DESKRIPSI: data.DESKRIPSI?data.DESKRIPSI:"",
        PATH_LAHAN_IMAGE: data.PATH_LAHAN_IMAGE? 'http://mrra.telkom.co.id/gis/assets'+data.PATH_LAHAN_IMAGE:"",
        STATUS_HGB: data.STATUS_HGB?data.STATUS_HGB:"",
    }
}

function transformImageGedung(data){
    return {
        ID: parseInt(data.ID),
        FILE_NAME: data.FILE_NAME?data.FILE_NAME:"",
        FILE_TITLE: data.FILE_TITLE?data.FILE_TITLE:"",
        FILE_PATH: data.FILE_PATH? 'http://mrra.telkom.co.id/gis/assets'+data.FILE_PATH:"",
        FILE_SIZE: data.FILE_SIZE?data.FILE_SIZE:0,
    }
}

function transformPBBGedung(data){
    return {
        ID: parseInt(data.ID),
        NOP: data.NOP?data.NOP:"",
        TAHUN: data.TAHUN?data.TAHUN:"",
        LUAS_LAHAN_BUMI: data.LUAS_LAHAN_BUMI?parseInt(data.LUAS_LAHAN_BUMI,10):0,
        NJOP_BUMI: data.NJOP_BUMI?parseInt(data.NJOP_BUMI,10):0,
        KELAS_BUMI: data.KELAS_BUMI?data.KELAS_BUMI:"",
        TOTAL_NJOP_BUMI: data.TOTAL_NJOP_BUMI?parseInt(data.TOTAL_NJOP_BUMI,10):0,
        LUAS_BANGUNAN: data.LUAS_BANGUNAN?parseInt(data.LUAS_BANGUNAN,10):0,
        NJOP_BANGUNAN: data.NJOP_BANGUNAN?parseInt(data.NJOP_BANGUNAN,10):0,
        KELAS_BANGUNAN: data.KELAS_BANGUNAN?data.KELAS_BANGUNAN:"",
        TOTAL_NJOP_BANGUNAN: data.TOTAL_NJOP_BANGUNAN?parseInt(data.TOTAL_NJOP_BANGUNAN,10):0,
        TOTAL_PBB_DIBAYAR: data.TOTAL_PBB_DIBAYAR?parseInt(data.TOTAL_PBB_DIBAYAR,10):0,
        HARGA_NJOP_SAAT_INI: data.HARGA_NJOP_SAAT_INI?parseInt(data.HARGA_NJOP_SAAT_INI,10):0,
    }
}
function transformNKAGedung(data){
    return {
        ID: parseInt(data.ID),
        NOMOR_KARTU_ASET: data.NOMOR_KARTU_ASET?data.NOMOR_KARTU_ASET:"",
        NOMOR_ANAK_KARTU: data.NOMOR_ANAK_KARTU?data.NOMOR_ANAK_KARTU:"",
        NILAI_HARGA_PEROLEHAN: data.NILAI_HARGA_PEROLEHAN?parseInt(data.NILAI_HARGA_PEROLEHAN,10):0,
        AKUMULASI_PENYUSUTAN: data.AKUMULASI_PENYUSUTAN?parseInt(data.AKUMULASI_PENYUSUTAN,10):0,
        BEBAN_PENYUSUTAN: data.BEBAN_PENYUSUTAN?parseInt(data.BEBAN_PENYUSUTAN,10):0,
        DESKRIPSI: data.DESKRIPSI?data.DESKRIPSI:"",
        TANGGAL:data.TANGGAL?data.TANGGAL:""
    }
}

function transformTagihanListrik(data){
    return {
        ID: parseInt(data.ID,10),
        ID_PELANGGAN: data.ID_PELANGGAN?data.ID_PELANGGAN:"",
        TANGGAL: data.TANGGAL?data.TANGGAL:"",
        JUMLAH_PEMAKAIAN: data.JUMLAH_PEMAKAIAN?parseInt(data.JUMLAH_PEMAKAIAN,10):0,
        BIAYA_LISTRIK: data.BIAYA_LISTRIK?parseInt(data.BIAYA_LISTRIK,10):0
    }
}

function transformTagihanAir(data){
    return {
        ID: parseInt(data.ID,10),
        ID_PELANGGAN: data.ID_PELANGGAN?data.ID_PELANGGAN:"",
        TANGGAL: data.TANGGAL?data.TANGGAL:"",
        JUMLAH_PEMAKAIAN: data.JUMLAH_PEMAKAIAN?parseInt(data.JUMLAH_PEMAKAIAN,10):0,
        BIAYA_AIR: data.BIAYA_AIR?parseInt(data.BIAYA_AIR,10):0
    }
}

module.exports = {
    transformList,
    transformGedungMaster,
    transformImageGedung,
    transformLahan,
    transformPBBGedung,
    transformNKAGedung,
    transformTagihanListrik,
    transformTagihanAir
}