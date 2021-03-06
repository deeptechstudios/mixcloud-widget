/*
 Copyright (C) 2015 DeepTech Studios

 This program is free software: you can redistribute it and/or modify
 it under the terms of the GNU General Public License as published by
 the Free Software Foundation, either version 3 of the License, or
 (at your option) any later version.

 This program is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU General Public License for more details.

 You should have received a copy of the GNU General Public License
 along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

//dependencies
var url = require('url');
var request = require('request');

module.exports = function MixCloudMediaRendererModule(pb) {

    //pb dependencies
    var util = pb.util;

    /**
     *
     * @class MixCloudMediaRenderer
     * @constructor
     */
    function MixCloudMediaRenderer(){}

    /**
     * The media type supported by the provider
     * @private
     * @static
     * @property TYPE
     * @type {String}
     */
    var TYPE = 'mixcloud';

    /**
     * Provides the styles used by each type of view
     * @private
     * @static
     * @property STYLES
     * @type {Object}
     */
    var STYLES = Object.freeze({

        view: {
            'max-width': "100%"
        },

        editor: {
            width: "560px",
            height: "315px"
        },

        post: {
            width: "560px",
            height: "315px"
        }
    });

    /**
     * Retrieves the style for the specified type of view
     * @static
     * @meethod getStyle
     * @param {String} viewType The view type calling for a styling
     * @return {Object} a hash of style properties
     */
    MixCloudMediaRenderer.getStyle = function(viewType) {
        return STYLES[viewType] || STYLES.view;
    };

    /**
     * Retrieves the supported media types as a hash.
     * @static
     * @method getSupportedTypes
     * @return {Object}
     */
    MixCloudMediaRenderer.getSupportedTypes = function() {
        var types = {};
        types[TYPE] = true;
        return types;
    };

    /**
     * Retrieves the name of the renderer.
     * @static
     * @method getName
     * @return {String}
     */
    MixCloudMediaRenderer.getName = function() {
        return 'MixCloudMediaRenderer';
    };

    /**
     * Determines if the URL to a media object is supported by this renderer
     * @static
     * @method isSupported
     * @param {String} urlStr
     * @return {Boolean} TRUE if the URL is supported by the renderer, FALSE if not
     */
    MixCloudMediaRenderer.isSupported = function(urlStr) {
        var details = url.parse(urlStr, true, true);
        return MixCloudMediaRenderer.isFullSite(details);
    };

    /**
     * Indicates if the passed URL to a media resource points to the main website
     * that provides the media represented by this media renderer
     * @static
     * @method isFullSite
     * @param {Object|String} parsedUrl The URL string or URL object
     * @return {Boolean} TRUE if URL points to the main domain and media resource, FALSE if not
     */
    MixCloudMediaRenderer.isFullSite = function(parsedUrl) {
        if (pb.utils.isString(parsedUrl)) {
            parsedUrl = url.parse(urlStr, true, true);
        }
        return parsedUrl.host && parsedUrl.host.indexOf('mixcloud.com') >= 0;
    };

    /**
     * Gets the specific type of the media resource represented by the provided URL
     * @static
     * @method getType
     * @param {String} urlStr
     * @return {String}
     */
    MixCloudMediaRenderer.getType = function(urlStr) {
        return MixCloudMediaRenderer.isSupported(urlStr) ? TYPE : null;
    };

    /**
     * Retrieves the Font Awesome icon class.  It is safe to assume that the type
     * provided will be a supported type by the renderer.
     * @static
     * @method getIcon
     * @param {String} type
     * @return {String}
     */
    MixCloudMediaRenderer.getIcon = function(type) {
        return TYPE;
    };

    /**
     * Renders the media resource via the raw URL to the resource
     * @static
     * @method renderByUrl
     * @param {String} urlStr
     * @param {Object} [options]
     * @param {Object} [options.attrs] A hash of all attributes (excluding style)
     * that will be applied to the element generated by the rendering
     * @param {Object} [options.style] A hash of all attributes that will be
     * applied to the style of the element generated by the rendering.
     * @param {Function} cb A callback where the first parameter is an Error if
     * occurred and the second is the rendering of the media resource as a HTML
     * formatted string
     */
    MixCloudMediaRenderer.renderByUrl = function(urlStr, options, cb) {
        MixCloudMediaRenderer.getMediaId(urlStr, function(err, mediaId) {
            if (util.isError(err)) {
                return cb(err);
            }
            MixCloudMediaRenderer.render({location: mediaId}, options, cb);
        });
    };

    /**
     * Renders the media resource via the media descriptor object.  It is only
     * guaranteed that the "location" property will be available at the time of
     * rendering.
     * @static
     * @method render
     * @param {Object} media
     * @param {String} media.location The unique resource identifier (only to the
     * media type) for the media resource
     * @param {Object} [options]
     * @param {Object} [options.attrs] A hash of all attributes (excluding style)
     * that will be applied to the element generated by the rendering
     * @param {Object} [options.style] A hash of all attributes that will be
     * applied to the style of the element generated by the rendering.
     * @param {Function} cb A callback where the first parameter is an Error if
     * occurred and the second is the rendering of the media resource as a HTML
     * formatted string
     */
    MixCloudMediaRenderer.render = function(media, options, cb) {
        if (pb.utils.isFunction(options)) {
            cb = options;
            options = {};
        }

        var oEmbedUrl = MixCloudMediaRenderer.getOEmbedUrl(media.location);
        MixCloudMediaRenderer.getOEmbedResource(oEmbedUrl, function(resource) {
            var content = resource ? resource.embed : "<span>Error retrieving resource!</span>";
            cb(null, new pb.TemplateValue(content, false));
        });
    };

    /**
     * Retrieves the resource from the MixCloud API
     * @static
     * @method getOEmbedResource
     * @param {String} oEmbedUrl The URI of the oEmbed query to retrieve the embed resource
     * @param {Function} cb The function to be called when the request is complete
     */
    MixCloudMediaRenderer.getOEmbedResource = function(oEmbedUrl, cb) {
        pb.log.info(oEmbedUrl);
        request({
            url: oEmbedUrl,
            json: true
        }, function(err, res, body) {
            if(err)
                pb.log.error(err);
            cb(body);
        });
    };

    /**
     * Retrieves the oEmbed URI that will be used when generating the rendering
     * @static
     * @method getOEmbedUrl
     * @param {String} mediaId The unique (only to the type) media identifier
     * @return {String} A properly formatted URI string that points to the oEmbed query of
     * the resource represented by the media Id
     */
    MixCloudMediaRenderer.getOEmbedUrl = function(mediaId) {
        return 'http://www.mixcloud.com/oembed/?url=https%3A//www.mixcloud.com' + mediaId + '&format=json';
    };

    /**
     * Retrieves the unique identifier from the URL provided.  The value should
     * distinguish the media resource from the others of this type and provide
     * insight on how to generate the embed URL.
     * @static
     * @method getMediaId
     */
    MixCloudMediaRenderer.getMediaId = function(urlStr, cb) {
        var details = url.parse(urlStr, true, true);
        if (MixCloudMediaRenderer.isFullSite(details)) {
            return cb(null, details.path);
        }
        return cb(null, null);
    };

    /**
     * Retrieves any meta data about the media represented by the URL.
     * @static
     * @method getMeta
     * @param {String} urlStr
     * @param {Boolean} isFile indicates if the URL points to a file that was
     * uploaded to the PB server
     * @param {Function} cb A callback that provides an Error if occurred and an
     * Object if meta was collected.  NULL if no meta was collected
     */
    MixCloudMediaRenderer.getMeta = function(urlStr, isFile, cb) {
        var details = url.parse(urlStr, true, true);

        var meta = details.query;
        cb(null, meta);
    };

    /**
     * Retrieves a URI to a thumbnail for the media resource
     * @static
     * @method getThumbnail
     * @param {String} urlStr
     * @param {Function} cb A callback where the first parameter is an Error if
     * occurred and the second is the URI string to the thumbnail.  Empty string or
     * NULL if no thumbnail is available
     */
    MixCloudMediaRenderer.getThumbnail = function(urlStr, cb) {
        MixCloudMediaRenderer.getMediaId(urlStr, function(err, mediaId) {
            MixCloudMediaRenderer.getOEmbedResource(MixCloudMediaRenderer.getOEmbedUrl(mediaId), function(resource) {
                cb(err, resource ? resource.image : '');
            });
        });
    };

    /**
     * Retrieves the native URL for the media resource.  This can be the raw page
     * where it was found or a direct link to the content.
     * @static
     * @method getNativeUrl
     */
    MixCloudMediaRenderer.getNativeUrl = function(media) {
        return 'https://www.mixcloud.com' + media.location;
    };

    //exports
    return MixCloudMediaRenderer;
};


