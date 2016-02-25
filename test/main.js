/*global describe, it*/
'use strict';

var fs = require('fs'),
    es = require('event-stream'),
    expect = require('expect.js'),
    sinon = require('sinon'),
    path = require('path');

require('mocha');

var gutil = require('gulp-util'),
    protactor = require('../').protractor,
    webdriver_update = require('../').webdriver_update,
    getProtractorDir = require('../').getProtractorDir,
    child_process = require('child_process'),
    events = require('events');

var winExt = /^win/.test(process.platform)?'.cmd':'';


describe('gulp-protactor: getProtractorDir', function() {

    it('should find the protractor installation', function(done) {
		expect(getProtractorDir()).to.equal(path.resolve('./node_modules/.bin'));
		done();
	});
});

	
describe('gulp-protactor: protactor', function() {

    it('should pass in the args into the protactor call', function(done) {
        var fakeProcess = new events.EventEmitter();
        var spy = sinon.stub(child_process, 'spawn', function(cmd, args, options) {

            expect(path.basename(cmd)).to.equal('protractor' + winExt);
            expect(path.basename(args[0])).to.equal('protactor.config.js');
            expect(args[1]).to.equal('--browser');
            expect(args[2]).to.equal('Chrome');
            expect(args[3]).to.equal('--chrome-only');
            child_process.spawn.restore();
            done();

            return new events.EventEmitter();
        });
        var srcFile = new gutil.File({
            path: 'test/fixtures/test.js',
            cwd: 'test/',
            base: 'test/fixtures',
            contents: null
        });

        var stream = protactor({
            configFile: 'test/fixtures/protactor.config.js',
            args: [
                '--browser', 'Chrome',
                '--chrome-only'
            ]
        });

        stream.write(srcFile);
        stream.end();
    });

    it('should pass the test-files to protactor via arg', function(done) {
        var fakeProcess = new events.EventEmitter();
        var spy = sinon.stub(child_process, 'spawn', function(cmd, args, options) {

            expect(path.basename(cmd)).to.equal('protractor'+winExt);
            expect(path.basename(args[0])).to.equal('protactor.config.js');
            expect(args[1]).to.equal('--specs');
            expect(args[2]).to.equal('test/fixtures/test.js');

            child_process.spawn.restore();
            done();

            return new events.EventEmitter();
        });

        var srcFile = new gutil.File({
            path: 'test/fixtures/test.js',
            cwd: 'test/',
            base: 'test/fixtures',
            contents: null
        });

        var stream = protactor({
            configFile: 'test/fixtures/protactor.config.js'
        });

        stream.write(srcFile);
        stream.end();

    });

    it('shouldnt pass the test-files to protactor if there are none', function(done) {
        var spy = sinon.stub(child_process, 'spawn', function(cmd, args, options) {

            expect(path.basename(cmd)).to.equal('protractor'+winExt);
            expect(path.basename(args[0])).to.equal('protactor.config.js');
            expect(args[1]).to.be(undefined);
            expect(args[2]).to.be(undefined);

            child_process.spawn.restore();
            done();

            return new events.EventEmitter();
        });

        var srcFile = new gutil.File({
            path: 'test/fixtures/test.js',
            cwd: 'test/',
            base: 'test/fixtures',
            contents: null
        });

        var stream = protactor({
            configFile: 'test/fixtures/protactor.config.js'
        });

        stream.end();

    });

    it('should propogate protactor exit code', function(done) {
        var fakeProcess = new events.EventEmitter();
        var spy = sinon.stub(child_process, 'spawn', function(cmd, args, options) {
            child_process.spawn.restore();
            process.nextTick(function() { fakeProcess.emit('exit', 255) });
            fakeProcess.kill = function() {};
            return fakeProcess;
        });

        var srcFile = new gutil.File({
            path: 'test/fixtures/test.js',
            cwd: 'test/',
            base: 'test/fixtures',
            contents: null
        });

        var stream = protactor({
            configFile: 'test/fixtures/protactor.config.js'
        });

        stream.write(srcFile);
        stream.end();
        stream.on('error', function(err) {
            done();
        });
    });
});


describe('gulp-protactor: webdriverupdate', function() {
    var fakeProcess, callback;

    beforeEach(function() {
        fakeProcess = new events.EventEmitter();
        callback = function(){};
    });

    afterEach(function() {
      fakeProcess.emit('exit');
    });

    it('should call webdriver-manager update with --standalone by default', function(done) {
        var spy = sinon.stub(child_process, 'spawn', function(cmd, args, options) {
            child_process.spawn.restore();
            expect(path.basename(cmd)).to.equal('webdriver-manager'+winExt);
            expect(args[0]).to.equal('update');
            expect(args[1]).to.equal('--standalone');
            done();
            return fakeProcess;
        });

        webdriver_update({}, callback);
    });

    it('should be possible to call webdriver-manager update without --standalone', function(done) {
        var spy = sinon.stub(child_process, 'spawn', function(cmd, args, options) {
            child_process.spawn.restore();
            expect(path.basename(cmd)).to.equal('webdriver-manager'+winExt);
            expect(args.length).to.equal(1);
            expect(args[0]).to.equal('update');
            done();
            return fakeProcess;
        });

        webdriver_update({ directConnect: true}, callback);
    });

});

