const callback = arguments[arguments.length - 1];

var res;
try {
    const controller = app.getController();
    const ds = controller.getDataService();
    var id;
    const movies = await ds.fetchData('movie');
    if (movies && movies.length > 0) {
        id = movies[0]['id'];
        const star = {
            'name': 'John Doe',
            'gender': 'male',
            'movies': [id]
        }
        //await loadScript('/public/js/model/crud/crudobject.js');
        const obj = new CrudObject('star', star);
        await obj.create();
        res = id;
    }
} catch (error) {
    alert('ERROR');
    console.error(error);
    res = error;
} finally {
    callback(res);
}