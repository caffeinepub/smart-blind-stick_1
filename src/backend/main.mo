import Map "mo:core/Map";
import Array "mo:core/Array";
import Time "mo:core/Time";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Order "mo:core/Order";
import Text "mo:core/Text";
import Runtime "mo:core/Runtime";

actor {
  type Status = {
    #Safe;
    #Emergency;
  };

  type Location = {
    latitude : Float;
    longitude : Float;
    timestamp : Int;
    status : Status;
    id : Nat;
  };

  module Location {
    public func compare(loc1 : Location, loc2 : Location) : Order.Order {
      Nat.compare(loc2.id, loc1.id); // sort descending by id (most recent first)
    };
  };

  var nextId = 0;
  let locations = Map.empty<Nat, Location>();

  func getLocationInternal(id : Nat) : Location {
    switch (locations.get(id)) {
      case (null) { Runtime.trap("Location not found") };
      case (?location) { location };
    };
  };

  public shared ({ caller }) func addLocation(latitude : Float, longitude : Float) : async Nat {
    let location : Location = {
      latitude;
      longitude;
      timestamp = Time.now();
      status = #Safe;
      id = nextId;
    };
    locations.add(nextId, location);
    let currentId = nextId;
    nextId += 1;
    currentId;
  };

  public query ({ caller }) func getAllLocations() : async [Location] {
    locations.values().toArray().sort();
  };

  public shared ({ caller }) func deleteLocation(id : Nat) : async () {
    if (not locations.containsKey(id)) {
      Runtime.trap("Location not found");
    };
    locations.remove(id);
  };

  public shared ({ caller }) func toggleStatus(id : Nat) : async () {
    let location = getLocationInternal(id);
    let newStatus = switch (location.status) {
      case (#Safe) { #Emergency };
      case (#Emergency) { #Safe };
    };
    let updatedLocation = { location with status = newStatus };
    locations.add(id, updatedLocation);
  };

  public query ({ caller }) func getStatistics() : async {
    totalCount : Nat;
    emergencyCount : Nat;
    lastLocation : ?Location;
  } {
    if (locations.isEmpty()) {
      return { totalCount = 0; emergencyCount = 0; lastLocation = null };
    };

    var emergencyCount = 0;
    var lastLocation : ?Location = null;
    var lastTimestamp : Int = -2 ** 63;

    for (location in locations.values()) {
      switch (location.status) {
        case (#Emergency) { emergencyCount += 1 };
        case (_) {};
      };
      if (location.timestamp > lastTimestamp) {
        lastTimestamp := location.timestamp;
        lastLocation := ?location;
      };
    };

    {
      totalCount = locations.size();
      emergencyCount;
      lastLocation;
    };
  };
};
