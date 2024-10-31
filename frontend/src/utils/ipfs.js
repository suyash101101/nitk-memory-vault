import { create } from '@web3-storage/w3up-client'

let client = null
let currentSpace = null

export async function initializeStorage() {
  if (!client) {
    try {
      // Create a new client
      client = await create()
      
      try {
        // Try to login first
        await client.login(process.env.REACT_APP_W3UP_EMAIL)
        console.log('Logged in successfully')
        
        // Get existing spaces
        const spaces = await client.spaces()
        if (spaces.length > 0) {
          currentSpace = spaces[0]
          await client.setCurrentSpace(currentSpace.did())
          console.log('Using existing space:', currentSpace.did())
        } else {
          // Create new space if none exists
          currentSpace = await client.createSpace('nitk-memory-vault')
          await currentSpace.save()
          await client.setCurrentSpace(currentSpace.did())
          console.log('Created new space:', currentSpace.did())
        }
      } catch (loginError) {
        console.log('Login failed, attempting registration...')
        
        // Get the proof from email
        const proof = await client.account.requestProof(process.env.REACT_APP_W3UP_EMAIL)
        
        // Register the proof with the service
        await client.account.register(proof)
        
        // Create a new space
        currentSpace = await client.createSpace('nitk-memory-vault')
        await currentSpace.save()
        await client.setCurrentSpace(currentSpace.did())
        console.log('Registration successful, space created:', currentSpace.did())
      }
      
      console.log('Storage initialized successfully')
      return client
    } catch (error) {
      console.error('Failed to initialize storage:', error)
      throw error
    }
  }
  
  // If client exists but no current space, try to set it
  if (!currentSpace) {
    try {
      const spaces = await client.spaces()
      if (spaces.length > 0) {
        currentSpace = spaces[0]
        await client.setCurrentSpace(currentSpace.did())
        console.log('Reset current space to:', currentSpace.did())
      }
    } catch (error) {
      console.error('Failed to reset current space:', error)
      throw error
    }
  }
  
  return client
}

export async function storeFiles(file) {
  try {
    if (!client || !currentSpace) {
      await initializeStorage()
    }

    // Double check we have a current space
    if (!client.currentSpace) {
      const spaces = await client.spaces()
      if (spaces.length > 0) {
        await client.setCurrentSpace(spaces[0].did())
      } else {
        throw new Error('No space available for upload')
      }
    }

    // Create a blob with the file data
    const blob = new Blob([file], { type: file.type })
    
    // Create a File object from the blob
    const filename = `${Date.now()}-${file.name}`
    const uploadFile = new File([blob], filename, { type: file.type })
    
    // Upload to web3.storage
    const cid = await client.uploadFile(uploadFile)
    console.log('File stored with CID:', cid)
    
    return cid.toString()
  } catch (error) {
    console.error('Error storing file:', error)
    throw error
  }
}

// Helper function to check space status
export async function checkSpaceStatus() {
  if (!client) return null
  
  try {
    const spaces = await client.spaces()
    return {
      hasSpace: spaces.length > 0,
      currentSpaceDid: currentSpace?.did() || null,
      spaceCount: spaces.length
    }
  } catch (error) {
    console.error('Error checking space status:', error)
    return null
  }
}