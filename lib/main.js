"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ratt_1 = require("@triply/ratt");
const middlewares_1 = __importDefault(require("@triply/ratt/lib/middlewares"));
const wkx_1 = __importDefault(require("wkx"));
async function default_1() {
    const app = new ratt_1.Ratt({
        defaultGraph: 'https://data.utwente.nl/utwente/amsterdam-kkg/graph/instances',
        destinations: {
            out: ratt_1.Ratt.Destination.file(`./data/amsterdam-kkg/chargingstations.nt`),
        },
        prefixes: {
            cs: ratt_1.Ratt.prefixer('https://data.utwente.nl/utwente/amsterdam-kkg/id/chargingstation/'),
            geometry: ratt_1.Ratt.prefixer('https://data.utwente.nl/utwente/amsterdam-kkg/id/geometry/'),
            rdf: ratt_1.Ratt.prefixer('http://www.w3.org/1999/02/22-rdf-syntax-ns#'),
            sdo: ratt_1.Ratt.prefixer('https://schema.org/'),
            geo: ratt_1.Ratt.prefixer('http://www.opengis.net/ont/geosparql#'),
            def: ratt_1.Ratt.prefixer('https://data.utwente.nl/utwente/amsterdam-kkg/model/def/'),
            xsd: ratt_1.Ratt.prefixer('http://www.w3.org/2001/XMLSchema#')
        },
        sources: {
            point: ratt_1.Ratt.Source.file(`static/amsterdamjsonsummed.json`),
        },
    });
    const chargingstation = middlewares_1.default.toIri(`id`, { prefix: app.prefix.cs });
    const geometry = middlewares_1.default.toIri.fromHashOf([`wkb_geometry`], { prefix: app.prefix.geometry });
    app.use(middlewares_1.default.fromJson(app.sources.point), middlewares_1.default.forEach('chargingpoints', [
        middlewares_1.default.addQuad(chargingstation, app.prefix.def('externalIdentifier'), middlewares_1.default.toLiteral(`chargingpoints.cs_external_id`, { datatype: app.prefix.xsd('string') })),
        middlewares_1.default.addQuad(chargingstation, app.prefix.rdf('type'), app.prefix.sdo('Place')),
        middlewares_1.default.add({
            key: '_address',
            value: context => context.getString('street') + ' ' + context.getString('housenumber')
        }),
        middlewares_1.default.addQuad(chargingstation, app.prefix.sdo('address'), middlewares_1.default.toLiteral('_address', { datatype: app.prefix.xsd('string') })),
        middlewares_1.default.change({
            key: `wkb_geometry`,
            type: 'any',
            change: value => wkx_1.default.Geometry.parseGeoJSON(value).toWkt()
        }),
        middlewares_1.default.addQuad(chargingstation, app.prefix.geo('hasGeometry'), geometry),
        middlewares_1.default.addQuad(geometry, app.prefix.rdf('type'), app.prefix.geo('Geometry')),
        middlewares_1.default.addQuad(geometry, app.prefix.geo('asWKT'), middlewares_1.default.toLiteral(`wkb_geometry`, { datatype: app.prefix.geo('wktLiteral') })),
    ]), middlewares_1.default.toRdf(app.destinations.out));
    return app;
}
exports.default = default_1;
//# sourceMappingURL=main.js.map