import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Location {
    id: bigint;
    status: Status;
    latitude: number;
    longitude: number;
    timestamp: bigint;
}
export enum Status {
    Safe = "Safe",
    Emergency = "Emergency"
}
export interface backendInterface {
    addLocation(latitude: number, longitude: number): Promise<bigint>;
    deleteLocation(id: bigint): Promise<void>;
    getAllLocations(): Promise<Array<Location>>;
    getStatistics(): Promise<{
        lastLocation?: Location;
        totalCount: bigint;
        emergencyCount: bigint;
    }>;
    toggleStatus(id: bigint): Promise<void>;
}
