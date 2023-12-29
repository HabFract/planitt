use std::collections::HashMap;

use hdk::prelude::{*, holo_hash::{EntryHashB64, ActionHashB64}};
use personal_integrity::*;

#[hdk_extern]
pub fn create_orbit(orbit: Orbit) -> ExternResult<Record> {
    let orbit_hash = create_entry(&EntryTypes::Orbit(orbit.clone()))?;
    let record = get(orbit_hash.clone(), GetOptions::default())?
        .ok_or(
            wasm_error!(
                WasmErrorInner::Guest(String::from("Could not find the newly created Orbit"))
            ),
        )?;
    Ok(record)
}
#[hdk_extern]
pub fn get_orbit(original_orbit_hash: ActionHash) -> ExternResult<Option<Record>> {
    let links = get_links(original_orbit_hash.clone(), LinkTypes::OrbitUpdates, None)?;
    let latest_link = links
        .into_iter()
        .max_by(|link_a, link_b| link_a.timestamp.cmp(&link_b.timestamp));
    let latest_orbit_hash = match latest_link {
        Some(link) => {
            link
                .target
                .clone()
                .into_action_hash()
                .ok_or(
                    wasm_error!(
                        WasmErrorInner::Guest(String::from("No action hash associated with link"))
                    ),
                )?
        }
        None => original_orbit_hash.clone(),
    };
    get(latest_orbit_hash, GetOptions::default())
}
#[derive(Serialize, Deserialize, Debug)]
pub struct UpdateOrbitInput {
    pub original_orbit_hash: ActionHash,
    pub previous_orbit_hash: ActionHash,
    pub updated_orbit: Orbit,
}
#[hdk_extern]
pub fn update_orbit(input: UpdateOrbitInput) -> ExternResult<Record> {
    let updated_orbit_hash = update_entry(
        input.previous_orbit_hash.clone(),
        &input.updated_orbit,
    )?;
    create_link(
        input.original_orbit_hash.clone(),
        updated_orbit_hash.clone(),
        LinkTypes::OrbitUpdates,
        (),
    )?;
    let record = get(updated_orbit_hash.clone(), GetOptions::default())?
        .ok_or(
            wasm_error!(
                WasmErrorInner::Guest(String::from("Could not find the newly updated Orbit"))
            ),
        )?;
    Ok(record)
}
#[hdk_extern]
pub fn delete_orbit(original_orbit_hash: ActionHash) -> ExternResult<ActionHash> {
    delete_entry(original_orbit_hash)
}

#[hdk_extern]
pub fn create_my_orbit(orbit: Orbit) -> ExternResult<Record> {
    let orbit_hash = create_entry(&EntryTypes::Orbit(orbit.clone()))?;
    let record = get(orbit_hash.clone(), GetOptions::default())?
        .ok_or(
            wasm_error!(
                WasmErrorInner::Guest(String::from("Could not find the newly created Orbit"))
            ),
        )?;
    debug!(
        "_+_+_+_+_+_+_+_+_+_ Created My Orbit: {:#?}",
        record.clone()
    );
    Ok(record)
}

#[hdk_extern]
pub fn get_all_my_orbits(_:()) -> ExternResult<Vec<Record>> {
    let orbit_entry_type: EntryType = UnitEntryTypes::Orbit.try_into()?; 
    let filter = ChainQueryFilter::new().entry_type(orbit_entry_type).include_entries(true); 
    
    let all_my_orbits = query(filter)?; 
    
    debug!(
        "_+_+_+_+_+_+_+_+_+_ All Orbits from my source chain: {:#?}",
        all_my_orbits.clone()
    );
    Ok(all_my_orbits)
}

#[hdk_extern]
pub fn get_orbit_hierarchy_json(input: ActionHashInput) -> ExternResult<String> {
    
    debug!(
        "_+_+_+_+_+_+_+_+_+_ All Orbits from my source chain: {:#?}",
        input.orbit_entry_hash_b64.clone()
    );
    Ok("hello".to_string())
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct ActionHashInput {
    pub orbit_entry_hash_b64: ActionHashB64
}

/** Private helpers */

fn build_tree(orbits: &[Orbit]) -> ExternResult<HashMap<EntryHashB64, Box<Node>>> {
    let mut tree: HashMap<EntryHashB64, Box<Node>> = HashMap::new();

    for orbit in orbits {
        let entry_hash = hash_entry(orbit.clone());
        if let Ok(hash) = entry_hash {
            let node = Box::new(Node::new(hash.clone().into(), Vec::new()));

            match orbit.parent_hash.clone() {
                Some(parent_hash) => {
                    if let Some(parent_node) = tree.get_mut(&parent_hash.clone().into()) {
                        parent_node.children.push(node);
                    }
                }
                None => {
                    tree.insert(hash.clone().into(), node);
                }
            }
        }
    }
    Ok(tree)
}


fn _agent_to_orbit_links() -> ExternResult<Option<Vec<Link>>> {
    let agent_address = agent_info()?.agent_initial_pubkey.clone();
    let links = get_links(agent_address, LinkTypes::AgentToOrbit, None)?;
    debug!("---- LINKS ---- {:#?}", links);
    if links.len() == 0 {
        return Ok(None);
    }
    Ok(Some(links))
}

fn _prefix_path(name: String) -> ExternResult<TypedPath> {
    // convert to lowercase for path for ease of search
    let lower_name = name.to_lowercase();
    let (prefix, _) = lower_name.as_str().split_at(3);

    Path::from(format!("all_orbits.{}", prefix)).typed(LinkTypes::OrbitsPrefixPath)
}

fn get_latest(action_hash: ActionHash) -> ExternResult<Record> {
    let details = get_details(action_hash, GetOptions::default())?.ok_or(wasm_error!(
        WasmErrorInner::Guest("Orbit not found".into())
    ))?;

    match details {
        Details::Entry(_) => Err(wasm_error!(WasmErrorInner::Guest(
            "Malformed details".into()
        ))),
        Details::Record(element_details) => match element_details.updates.last() {
            Some(update) => get_latest(update.action_address().clone()),
            None => Ok(element_details.record),
        },
    }
}
