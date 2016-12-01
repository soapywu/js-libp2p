/* eslint-env mocha */
'use strict'

const expect = require('chai').expect
const PeerInfo = require('peer-info')
const Swarm = require('libp2p-swarm')
const TCP = require('libp2p-tcp')
const multiaddr = require('multiaddr')
const series = require('async/series')
const parallel = require('async/parallel')

const Ping = require('./../src')

describe('libp2p ping', () => {
  let swarmA
  let swarmB
  let peerA
  let peerB

  before((done) => {
    series([
      (cb) => {
        PeerInfo.create((err, peerInfo) => {
          expect(err).to.not.exist
          peerA = peerInfo
          peerA.multiaddr.add(multiaddr('/ip4/127.0.0.1/tcp/0'))
          cb()
        })
      },
      (cb) => {
        PeerInfo.create((err, peerInfo) => {
          expect(err).to.not.exist
          peerB = peerInfo
          peerB.multiaddr.add(multiaddr('/ip4/127.0.0.1/tcp/0'))
          cb()
        })
      },
      (cb) => {
        swarmA = new Swarm(peerA)
        swarmB = new Swarm(peerB)
        swarmA.transport.add('tcp', new TCP())
        swarmB.transport.add('tcp', new TCP())
        cb()
      },
      (cb) => swarmA.listen(cb),
      (cb) => swarmB.listen(cb)
    ], done)
  })

  after((done) => {
    parallel([
      (cb) => swarmA.close(cb),
      (cb) => swarmB.close(cb)
    ], done)
  })

  it('mount ping protocol', () => {
    Ping.mount(swarmA)
    Ping.mount(swarmB)
  })

  it('ping once from peerA to peerB', (done) => {
    const p = new Ping(swarmA, peerB)

    p.on('error', (err) => {
      expect(err).to.not.exist
    })

    p.on('ping', (time) => {
      expect(time).to.be.a('Number')
      p.stop()
      done()
    })
  })

  it.skip('ping 3 times from peerA to peerB', (done) => {})

  it('unmount PING protocol', () => {
    Ping.unmount(swarmA)
    Ping.unmount(swarmB)
  })
})
