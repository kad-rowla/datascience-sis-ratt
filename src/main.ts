import { Ratt } from '@triply/ratt'
import mw from '@triply/ratt/lib/middlewares'
import wkx from 'wkx'
import {lang, literal} from './ratt-helpers'

export default async function (): Promise<Ratt> {
  const app = new Ratt({
    defaultGraph: 'https://data.utwente.nl/utwente/amsterdam-kkg/graph/instances',
    destinations: {
      out: Ratt.Destination.file(`./data/amsterdam-kkg/chargingstations.nt`),
    },
    prefixes: {
      cs: Ratt.prefixer('https://data.utwente.nl/utwente/amsterdam-kkg/id/chargingstation/'),
      geometry: Ratt.prefixer('https://data.utwente.nl/utwente/amsterdam-kkg/id/geometry/'),
      rdf: Ratt.prefixer('http://www.w3.org/1999/02/22-rdf-syntax-ns#'),
      sdo: Ratt.prefixer('https://schema.org/'),
      geo: Ratt.prefixer('http://www.opengis.net/ont/geosparql#'),
      def: Ratt.prefixer('https://data.utwente.nl/utwente/amsterdam-kkg/model/def/'),
      xsd: Ratt.prefixer('http://www.w3.org/2001/XMLSchema#')
    },
    sources: {
      point: Ratt.Source.file(`static/amsterdamjsonsummed.json`),
    },
  })
  // this turns every charging point in your set into a URI based on its id in the json. Makes sure that every one is unique basically. 
  const chargingstation = mw.toIri(`id`, {prefix: app.prefix.cs})
  const geometry = mw.toIri.fromHashOf([`wkb_geometry`], {prefix: app.prefix.geometry})
 
  app.use(
    mw.fromJson(app.sources.point),
    mw.forEach('chargingpoints', [

    // this is an example of how you can add all your attributes to your graph. 'string' is one data type but you can also use 'integer', 'boolean', 'decimal' and 'dateTime'
    mw.addQuad(chargingstation, app.prefix.def('externalIdentifier'), mw.toLiteral(`chargingpoints.cs_external_id`, {datatype: app.prefix.xsd('string')})), 
    
    //this makes a charging station a type of place
    mw.addQuad(chargingstation, app.prefix.rdf('type'), app.prefix.sdo('Place')), 
    
    // this combines different attributes into a single one when in linked data
    mw.add({
      key: '_address',
      value: context => context.getString('street') + ' ' + context.getString('housenumber')
    }),
    mw.addQuad(chargingstation, app.prefix.sdo('address'), mw.toLiteral('_address', {datatype: app.prefix.xsd('string')})),

    // this is how to transform all your geometries into a linked data format geometry (and it should be visible in the triplestore)
    mw.change({
      key: `wkb_geometry`,
      type: 'any',
      change: value => wkx.Geometry.parseGeoJSON(value).toWkt()}),
    mw.addQuad(chargingstation, app.prefix.geo('hasGeometry'), geometry),
    mw.addQuad(geometry, app.prefix.rdf('type'), app.prefix.geo('Geometry')),
    mw.addQuad(
      geometry,
      app.prefix.geo('asWKT'),
      mw.toLiteral(`wkb_geometry`, {datatype: app.prefix.geo('wktLiteral')})),

    ]), 
    mw.toRdf(app.destinations.out),
  )
  return app
}
