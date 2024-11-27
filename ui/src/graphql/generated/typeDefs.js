
import { gql } from "@apollo/client/core";
export const typeDefs = gql`schema{query:Query mutation:Mutation}type Query{sphere(id:ID!):Sphere!spheres:SphereConnection!orbit(id:ID!):Orbit!orbits(sphereEntryHashB64:String):OrbitConnection!getOrbitHierarchy(params:OrbitHierarchyQueryParams!):String!getLowestSphereHierarchyLevel(sphereEntryHashB64:String!):Int!getWinRecordForOrbitForMonth(params:OrbitWinRecordQueryParams):WinRecord winRecords:[WinRecord!]!me:AgentProfile!}type Mutation{createSphere(sphere:SphereCreateParams):CreateSphereResponsePayload!updateSphere(sphere:SphereUpdateParams):CreateSphereResponsePayload!deleteSphere(sphereHash:ID!):ID!createOrbit(orbit:OrbitCreateParams):CreateOrbitResponsePayload!updateOrbit(orbit:OrbitUpdateParams):UpdateOrbitResponsePayload!deleteOrbit(orbitHash:ID!):ID!createProfile(profile:UserProfileCreateUpdateParams):AgentProfile!updateProfile(profile:UserProfileCreateUpdateParams):AgentProfile!createWinRecord(winRecord:WinRecordCreateParams!):WinRecord!updateWinRecord(winRecord:WinRecordUpdateParams!):WinRecord!}type PageInfo{hasNextPage:Boolean!hasPreviousPage:Boolean!startCursor:String!endCursor:String!}interface Node{id:ID!eH:String!}type CreateSphereResponsePayload{id:ID!actionHash:String!entryHash:String!eH:String!spin:String!name:String!metadata:SphereMetaData}type CreateOrbitResponsePayload{id:ID!eH:String!name:String!sphereHash:String!parentHash:String childHash:String frequency:Frequency!scale:Scale!metadata:OrbitMetaData}type UpdateOrbitResponsePayload{id:ID!eH:String!name:String!sphereHash:String!parentHash:String childHash:String frequency:Frequency!scale:Scale!metadata:OrbitMetaData}type AgentProfile{agentPubKey:String!profile:Profile!}type Profile{nickname:String!fields:ProfileFields}type ProfileFields{location:String isPublic:String avatar:String}input UserProfileCreateUpdateParams{nickname:String!location:String isPublic:String avatar:String}type SphereConnection{edges:[SphereEdge!]!pageInfo:PageInfo!}type SphereEdge{cursor:String!node:Sphere!}type Sphere implements Node{id:ID!eH:String!name:String!spin:String!metadata:SphereMetaData}type SphereMetaData{description:String!hashtag:String image:String}input SphereCreateParams{name:String!description:String hashtag:String image:String spin:String}input SphereUpdateParams{id:ID!name:String!description:String hashtag:String image:String spin:String}type OrbitConnection{edges:[OrbitEdge!]!pageInfo:PageInfo!}type OrbitEdge{cursor:String!node:Orbit!}type Orbit implements Node{id:ID!eH:String!name:String!sphereHash:String!parentHash:String childHash:String frequency:Frequency!scale:Scale!metadata:OrbitMetaData}type TimeFrame{startTime:Float!endTime:Float}enum Frequency{ONE_SHOT DAILY_OR_MORE_1d DAILY_OR_MORE_2d DAILY_OR_MORE_3d LESS_THAN_DAILY_1w LESS_THAN_DAILY_1m LESS_THAN_DAILY_1q}enum Scale{Astro Sub Atom}type OrbitMetaData{description:String timeframe:TimeFrame!}input OrbitCreateParams{name:String!startTime:Float!endTime:Float description:String frequency:Frequency!scale:Scale!sphereHash:String!parentHash:String childHash:String}input OrbitUpdateParams{id:ID!name:String!startTime:Float!endTime:Float description:String frequency:Frequency!scale:Scale!sphereHash:String!parentHash:String}input OrbitHierarchyQueryParams{orbitEntryHashB64:String levelQuery:QueryParamsLevel}input QueryParamsLevel{sphereHashB64:String orbitLevel:Float!}type WinRecord{id:ID!eH:String!orbitId:ID!winData:[WinDateEntry!]!}type WinDateEntry{date:String!value:WinDateValue!}union WinDateValue=SingleWin|MultipleWins type SingleWin{single:Boolean!}type MultipleWins{multiple:[Boolean!]!}input OrbitWinRecordQueryParams{orbitEh:String!yearDotMonth:String!}input WinRecordCreateParams{orbitEh:String!winData:[WinDateEntryInput!]!}input WinRecordUpdateParams{winRecordId:ID!updatedWinRecord:WinRecordCreateParams}input WinDateEntryInput{date:String!single:Boolean multiple:[Boolean!]}`;