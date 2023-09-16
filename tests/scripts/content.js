var callback = arguments[arguments.length - 1];
(async function () {
    try {
        var controller = app.getController();
        var ds = controller.getDataService();
        var id;
        var movies = await ds.fetchData('movie');
        if (movies && movies.length > 0) {
            id = movies[0]['id'];
            var star = {
                'name': 'John Doe',
                'movies': [id]
            }
            //await loadScript('/public/js/model/crud/crudobject.js');
            var obj = new CrudObject('star', star);
            await obj.create();
        }
        callback(id);
    } catch (error) {
        alert('ERROR');
        console.error(error);
        callback(error);
    }
})();